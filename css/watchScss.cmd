@echo off
SETLOCAL ENABLEEXTENSIONS

REM SET YOUR RUBY PATH HERE
REM ==================================
SET RUBY_BIN=C:\Ruby22-x64\bin
REM ==================================

call %RUBY_BIN%\sass --watch doe.scss:doe.css