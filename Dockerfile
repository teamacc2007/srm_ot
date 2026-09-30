# ==========================================
# Stage 1: Build the Angular 22 Frontend
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npx vite build

# ==========================================
# Stage 2: Build the .NET 10 Backend
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-builder
WORKDIR /src

COPY backend/backend.csproj ./backend/
RUN dotnet restore backend/backend.csproj

COPY backend/ ./backend/
RUN dotnet publish backend/backend.csproj -c Release -o /app/publish

# Copy the built Angular 22 artifacts into the publish directory
COPY --from=frontend-builder /app/dist /app/dist

# ==========================================
# Stage 3: Runtime
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=backend-builder /app/publish .
COPY --from=frontend-builder /app/dist /dist

ENV ASPNETCORE_URLS=http://+:5100
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5100

ENTRYPOINT ["dotnet", "backend.dll"]
