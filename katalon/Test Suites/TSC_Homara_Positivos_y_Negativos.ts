<?xml version="1.0" encoding="UTF-8"?>
<TestSuiteCollectionEntity>
   <description>Ejecuta en secuencia la suite de casos positivos y la de casos negativos en Chrome con el perfil default</description>
   <name>TSC_Homara_Positivos_y_Negativos</name>
   <tag></tag>
   <executionMode>SEQUENTIAL</executionMode>
   <maxConcurrentInstances>1</maxConcurrentInstances>
   <testSuiteRunConfigurations>
      <TestSuiteRunConfiguration>
         <configuration>
            <groupName>Web Desktop</groupName>
            <profileName>default</profileName>
            <runConfigurationId>Chrome</runConfigurationId>
         </configuration>
         <runEnabled>true</runEnabled>
         <testSuiteEntity>Test Suites/TS_Casos_Positivos</testSuiteEntity>
      </TestSuiteRunConfiguration>
      <TestSuiteRunConfiguration>
         <configuration>
            <groupName>Web Desktop</groupName>
            <profileName>default</profileName>
            <runConfigurationId>Chrome</runConfigurationId>
         </configuration>
         <runEnabled>true</runEnabled>
         <testSuiteEntity>Test Suites/TS_Casos_Negativos</testSuiteEntity>
      </TestSuiteRunConfiguration>
   </testSuiteRunConfigurations>
</TestSuiteCollectionEntity>
