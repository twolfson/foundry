@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\foundry-release-echo.cmd" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\foundry-release-echo.cmd" %*
)
