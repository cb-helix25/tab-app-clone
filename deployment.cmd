@echo off
echo --------------------------------------------------
echo Running custom deployment script...
echo --------------------------------------------------

:: %DEPLOYMENT_TARGET% is an environment variable set by Kudu that points to D:\home\site\wwwroot
cd /d "%DEPLOYMENT_TARGET%"

echo Installing dependencies using npm ci...
call npm ci

echo --------------------------------------------------
echo Finished installing dependencies.
echo --------------------------------------------------
