"""Pruebas E2E de Homara con Browser Use.

Un agente de IA (Claude por defecto) recorre la aplicación siguiendo una
instrucción en lenguaje natural. El resultado NO se valida preguntándole a la
IA: se verifica de forma determinística contra la API del backend o contra la
URL final del recorrido.

Uso:
    uv run pruebas.py            # los 15 casos
    uv run pruebas.py TC01 TC07  # solo algunos
"""

import asyncio
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from browser_use import Agent, Browser, ChatAnthropic, ChatGoogle  # noqa: E402

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
API_URL = os.getenv("API_URL", "http://localhost:5000/api/v1")
CLIENTE = ("juan@email.com", "123456")
ADMIN = ("admin@homara.co", "123456")
PRODUCTO_CARRITO = "Pintura Koraza Caneca 5 Galones"  # 549.000 COP: envío gratis
PRODUCTO_ELIMINAR = "Rodillo de Pintura Antigoteo 23cm"
EVIDENCIAS = Path(__file__).resolve().parent / "evidencias"
SELLO = str(int(time.time()))


# ---------------------------------------------------------------- API (oráculo)

def login(email: str, clave: str) -> httpx.Response:
    return httpx.post(f"{API_URL}/users/login", json={"email": email, "password": clave})


def token(usuario: tuple[str, str]) -> str:
    return login(*usuario).json()["data"]["token"]


def api(metodo: str, ruta: str, tok: str | None = None, **kw) -> httpx.Response:
    headers = {"Authorization": f"Bearer {tok}"} if tok else {}
    return httpx.request(metodo, f"{API_URL}{ruta}", headers=headers, **kw)


def productos(termino: str) -> list[dict]:
    return api("GET", "/products", params={"q": termino}).json()["data"]


def carrito(tok: str) -> dict:
    return api("GET", "/cart", tok).json()["data"]


def vaciar_carrito(tok: str) -> None:
    for item in carrito(tok)["items"]:
        api("DELETE", f"/cart/items/{item['id']}", tok)


def agregar_al_carrito(tok: str, nombre: str) -> None:
    producto = next(p for p in productos(nombre) if p["name"] == nombre)
    api("POST", "/cart/items", tok, json={"productId": producto["id"], "quantity": 1})


def pedidos(tok: str) -> list[dict]:
    return api("GET", "/orders", tok).json()["data"]


def proyectos(tok: str) -> list[dict]:
    return api("GET", "/projects", tok).json()["data"]


# ------------------------------------------------------------------- Casos

class Mensaje(BaseModel):
    mensaje: str


class Resultados(BaseModel):
    nombres_productos: list[str]


@dataclass
class Caso:
    id: str
    nombre: str
    tarea: str
    verificar: Callable[[object, dict], tuple[bool, str]]
    preparar: Callable[[], dict] = lambda: {}
    esquema: type[BaseModel] | None = None


def url_final(historial) -> str:
    urls = [u for u in historial.urls() if u]
    return urls[-1] if urls else ""


def termina_en(ruta: str):
    def verificar(h, _):
        url = url_final(h)
        return url.rstrip("/").endswith(ruta), f"URL final: {url}"
    return verificar


def instruccion_login(usuario: tuple[str, str]) -> str:
    return (f"Abre {BASE_URL}/login e inicia sesión con el correo {usuario[0]} "
            f"y la contraseña {usuario[1]}.")


def preparar_carrito_con(nombre: str | None):
    def preparar():
        tok = token(CLIENTE)
        vaciar_carrito(tok)
        if nombre:
            agregar_al_carrito(tok, nombre)
        return {"token": tok, "pedidos_antes": len(pedidos(tok))}
    return preparar


def verificar_busqueda(termino: str, con_resultados: bool):
    def verificar(h, _):
        vistos = h.structured_output.nombres_productos if h.structured_output else None
        esperados = {p["name"] for p in productos(termino)}
        if vistos is None:
            return False, "el agente no devolvió la lista de productos"
        if not con_resultados:
            return len(vistos) == 0 and len(esperados) == 0, f"vistos={vistos}"
        ok = len(vistos) > 0 and set(vistos) <= esperados
        return ok, f"vistos={len(vistos)} en API={len(esperados)}"
    return verificar


def verificar_carrito_total(h, ctx):
    c = carrito(ctx["token"])
    nombres = [i["product"]["name"] for i in c["items"]]
    ok = nombres == [PRODUCTO_CARRITO] and c["subtotal"] == 549000 and c["shipping"] == 0 and c["total"] == 549000
    return ok, f"items={nombres} subtotal={c['subtotal']} envío={c['shipping']} total={c['total']}"


def verificar_carrito_vacio(h, ctx):
    c = carrito(ctx["token"])
    return len(c["items"]) == 0, f"items en carrito={len(c['items'])}"


def verificar_sin_pedido(h, ctx):
    total = len(pedidos(ctx["token"]))
    return total == ctx["pedidos_antes"] and "/checkout" in url_final(h), f"pedidos {ctx['pedidos_antes']}→{total}, URL {url_final(h)}"


def verificar_pedido_creado(h, ctx):
    total = len(pedidos(ctx["token"]))
    vacio = len(carrito(ctx["token"])["items"]) == 0
    return total == ctx["pedidos_antes"] + 1 and vacio, f"pedidos {ctx['pedidos_antes']}→{total}, carrito vacío={vacio}"


NUEVO_CORREO = f"ia.{SELLO}@homara.co"
NUEVO_PRODUCTO = f"Producto IA {SELLO}"
NUEVO_PROYECTO = f"Proyecto IA {SELLO}"


def verificar_producto_creado(h, ctx):
    encontrados = [p for p in productos(NUEVO_PRODUCTO) if p["name"] == NUEVO_PRODUCTO]
    adm = token(ADMIN)
    for p in encontrados:  # limpieza
        api("DELETE", f"/products/{p['id']}", adm)
    return len(encontrados) == 1, f"productos con ese nombre: {len(encontrados)}"


def verificar_proyecto_creado(h, ctx):
    nombres = [p["name"] for p in proyectos(token(CLIENTE))]
    return NUEVO_PROYECTO in nombres, f"proyecto en API: {NUEVO_PROYECTO in nombres}"


CASOS = [
    Caso("TC01", "Login exitoso (ESC02)",
         instruccion_login(CLIENTE) + " Termina cuando veas la página de tu cuenta.",
         termina_en("/cuenta")),
    Caso("TC02", "Login inválido (ESC02)",
         f"Abre {BASE_URL}/login e intenta iniciar sesión con {CLIENTE[0]} y la contraseña claveIncorrecta1. "
         "Devuelve el mensaje de error que muestra la página, sin reintentar.",
         lambda h, _: ((m := h.structured_output.mensaje if h.structured_output else "") .startswith("Credenciales incorrectas")
                       and "/login" in url_final(h), f"mensaje='{m}'"),
         esquema=Mensaje),
    Caso("TC03", "Registro exitoso (ESC01)",
         f"Abre {BASE_URL}/register y crea una cuenta con nombre Laura, apellido Gómez, correo {NUEVO_CORREO} "
         "y contraseña ClaveIA2026 (en ambos campos de contraseña). Termina cuando se complete el registro.",
         lambda h, _: (login(NUEVO_CORREO, "ClaveIA2026").status_code == 200, "login del usuario nuevo por API")),
    Caso("TC04", "Registro con contraseñas distintas (ESC01)",
         f"Abre {BASE_URL}/register y llena el registro con nombre Carlos, apellido Ruiz, correo distintas.{NUEVO_CORREO}, "
         "contraseña ClaveIA2026 y confirmación ClaveIA2025. Envía el formulario una sola vez y devuelve el mensaje de error.",
         lambda h, _: (login(f"distintas.{NUEVO_CORREO}", "ClaveIA2026").status_code == 401
                       and "no coinciden" in (h.structured_output.mensaje if h.structured_output else ""),
                       "usuario no creado y mensaje de contraseñas"),
         esquema=Mensaje),
    Caso("TC05", "Búsqueda con resultados (ESC09)",
         f"Abre {BASE_URL}/catalogo, busca 'Porcelanato' y devuelve los nombres de los productos que aparecen en la primera página.",
         verificar_busqueda("Porcelanato", True), esquema=Resultados),
    Caso("TC06", "Búsqueda sin resultados (ESC09)",
         f"Abre {BASE_URL}/catalogo, busca 'xyzproductoinexistente' y devuelve los nombres de los productos que aparecen (lista vacía si no hay).",
         verificar_busqueda("xyzproductoinexistente", False), esquema=Resultados),
    Caso("TC07", "Agregar al carrito y validar total (ESC13, ESC16)",
         instruccion_login(CLIENTE) + f" Luego busca '{PRODUCTO_CARRITO}' en el catálogo, agrégalo una vez al carrito "
         "y abre el carrito.",
         verificar_carrito_total, preparar_carrito_con(None)),
    Caso("TC08", "Eliminar del carrito (ESC15)",
         instruccion_login(CLIENTE) + f" Luego abre el carrito y elimina el producto '{PRODUCTO_ELIMINAR}'.",
         verificar_carrito_vacio, preparar_carrito_con(PRODUCTO_ELIMINAR)),
    Caso("TC09", "Checkout con campos faltantes (ESC27)",
         instruccion_login(CLIENTE) + f" Luego abre {BASE_URL}/checkout, escribe solo el nombre 'Juan' dejando vacíos "
         "la dirección y la ciudad, e intenta confirmar el pedido una vez. No completes los campos vacíos.",
         verificar_sin_pedido, preparar_carrito_con(PRODUCTO_CARRITO)),
    Caso("TC10", "Checkout completo genera pedido (ESC28)",
         instruccion_login(CLIENTE) + f" Luego abre {BASE_URL}/checkout, completa todos los campos obligatorios "
         "(dirección Calle 123 # 45-67, ciudad Medellín, departamento Antioquia, teléfono 3001234567), "
         "elige el pago en efectivo y confirma el pedido.",
         verificar_pedido_creado, preparar_carrito_con(PRODUCTO_CARRITO)),
    Caso("TC11", "Ruta privada sin sesión (ESC07)",
         f"Abre directamente {BASE_URL}/proyectos sin iniciar sesión y termina en la página a la que te lleve la aplicación.",
         termina_en("/login")),
    Caso("TC12", "Cliente no accede a /admin (ESC07, ESC32)",
         instruccion_login(CLIENTE) + f" Después abre directamente {BASE_URL}/admin y termina en la página a la que "
         "te lleve la aplicación, sin hacer nada más.",
         # La URL debe ser de la app: about:blank (el agente no navegó) no cuenta como aprobado.
         lambda h, _: (url_final(h).startswith(BASE_URL) and "/admin" not in url_final(h),
                       f"URL final: {url_final(h)}")),
    Caso("TC13", "Admin crea producto (ESC32)",
         instruccion_login(ADMIN) + f" Luego ve a {BASE_URL}/admin/productos y crea un producto llamado "
         f"'{NUEVO_PRODUCTO}', descripción 'Creado por agente de IA', cualquier categoría, unidad 'unidad', "
         "precio 10000 y stock 5. Guárdalo.",
         verificar_producto_creado),
    Caso("TC14", "Crear proyecto válido (ESC17)",
         instruccion_login(CLIENTE) + f" Luego ve a {BASE_URL}/proyectos/nuevo y crea un proyecto de piso llamado "
         f"'{NUEVO_PROYECTO}' de 4 metros de largo por 3 de ancho. Guárdalo.",
         verificar_proyecto_creado),
    Caso("TC15", "Cerrar sesión (ESC03)",
         instruccion_login(CLIENTE) + " Luego cierra la sesión desde el menú y termina.",
         lambda h, _: ("/cuenta" not in url_final(h), f"URL final: {url_final(h)}")),
]


# ------------------------------------------------------------------- Runner

# Los modelos Claude actuales solo aceptan tool_choice "auto": se pide explícitamente usar la herramienta.
# use_thinking=False: no se le pide al modelo escribir su razonamiento (Opus 5.5 lo rechaza como "reasoning_extraction").
INSTRUCCION_HERRAMIENTA = ("Responde SIEMPRE llamando a la herramienta de salida con tu estado y tus acciones; "
                           "nunca respondas solo con texto. Para ir al carrito u otras secciones usa los enlaces de la barra "
                           "de navegación en lugar de escribir la URL.")


def modelo():
    if os.getenv("LLM_PROVIDER", "anthropic") == "gemini":
        return ChatGoogle(model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), api_key=os.environ["GOOGLE_API_KEY"])
    # thinking adaptativo: los modelos Claude actuales no aceptan tool_choice forzado.
    return ChatAnthropic(model=os.getenv("CLAUDE_MODEL", "claude-opus-5-5"), thinking={"type": "adaptive"})


async def ejecutar(caso: Caso, llm) -> dict:
    ctx = caso.preparar()
    # Las páginas de Homara entran con una animación: se espera a que termine antes de actuar.
    browser = Browser(headless=os.getenv("HEADLESS", "false") == "true",
                      minimum_wait_page_load_time=1.5, wait_between_actions=0.5)
    agente = Agent(task=caso.tarea, llm=llm, browser=browser, output_model_schema=caso.esquema,
                   extend_system_message=INSTRUCCION_HERRAMIENTA, use_thinking=False,
                   generate_gif=str(EVIDENCIAS / f"{caso.id}.gif"))
    inicio = time.time()
    try:
        historial = await agente.run(max_steps=25)
        ok, detalle = caso.verificar(historial, ctx)
    except Exception as error:  # una excepción nunca cuenta como prueba superada
        ok, detalle = False, f"{type(error).__name__}: {error}"
    finally:
        await browser.kill()
    return {"id": caso.id, "caso": caso.nombre, "ok": ok, "detalle": detalle, "segundos": round(time.time() - inicio)}


async def main():
    EVIDENCIAS.mkdir(exist_ok=True)
    filtro = set(sys.argv[1:])
    llm = modelo()
    resultados = []
    for caso in [c for c in CASOS if not filtro or c.id in filtro]:
        r = await ejecutar(caso, llm)
        print(f"{'APROBADO' if r['ok'] else 'FALLIDO '} {r['id']} {r['caso']} — {r['detalle']}")
        resultados.append(r)
    (EVIDENCIAS / "resultados.json").write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    aprobados = sum(r["ok"] for r in resultados)
    print(f"\n{aprobados}/{len(resultados)} aprobados ({llm.model})")
    sys.exit(0 if aprobados == len(resultados) else 1)


if __name__ == "__main__":
    asyncio.run(main())
