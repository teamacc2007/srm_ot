#!/usr/bin/env bash
set -e

echo "🚀 Building Angular 22 frontend..."
npx vite build

echo "🏥 Starting unified .NET 10 host..."
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$PATH"
dotnet run --project backend
