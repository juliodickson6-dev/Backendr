@echo off
REM Script de testes da API AJOV
REM Use este arquivo para testar os endpoints

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:3000/api

echo.
echo ====================================
echo TESTES API AJOV - Ficha de Cadastro
echo ====================================
echo.

REM Health Check
echo [1] Health Check
echo.
curl -X GET "%BASE_URL:~0,-4%/health" -H "Content-Type: application/json"
echo.
echo.

REM Criar Cadastro
echo [2] Criar Cadastro
echo.
curl -X POST "%BASE_URL%/cadastro/criar" ^
  -H "Content-Type: application/json" ^
  -d "{\"nomeCompleto\":\"João Silva\",\"nomeMae\":\"Maria Silva\",\"dataNascimento\":\"1995-05-15\",\"sexo\":\"masculino\",\"estadoCivil\":\"solteiro\",\"nacionalidade\":\"Moçambicana\",\"naturalidade\":\"Maputo\",\"numeroIdentificacao\":\"123456789ABC\",\"celular\":\"258840000000\",\"email\":\"joao@email.com\",\"motivacao\":\"Quero ajudar\",\"aceiteDeclaracao\":true}"
echo.
echo.

REM Listar Cadastros (defina ADMIN_API_TOKEN no ambiente para autorizar)
echo [3] Listar Cadastros
echo.
curl -X GET "%BASE_URL%/cadastro/listar?page=1&limit=10" -H "Content-Type: application/json" -H "Authorization: Bearer %ADMIN_API_TOKEN%"
echo.
echo.

REM Obter Estatísticas
echo [4] Obter Estatísticas
echo.
curl -X GET "%BASE_URL%/cadastro/estatisticas" -H "Content-Type: application/json" -H "Authorization: Bearer %ADMIN_API_TOKEN%"
echo.
echo.

echo ====================================
echo Testes Concluídos
echo ====================================
echo.

pause
