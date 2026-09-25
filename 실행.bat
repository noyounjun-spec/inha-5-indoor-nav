@echo off
chcp 65001 >nul
rem 5호관 길찾기 웹 앱 실행 (Windows): 더블클릭하면 필요한 패키지를 설치하고 브라우저를 연다.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js가 없습니다. https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

if not exist node_modules (
  echo 처음 실행: 패키지를 설치합니다...
  call npm install
  if errorlevel 1 (
    echo 패키지 설치에 실패했습니다.
    pause
    exit /b 1
  )
)

echo 개발 서버를 시작합니다. 브라우저가 자동으로 열립니다. 끝내려면 이 창을 닫으세요.
call npm run dev
pause
