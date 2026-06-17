# ---------- Build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore (cache theo csproj để build lại nhanh hơn)
COPY LichSuDang.sln ./
COPY LichSuDang.Api/LichSuDang.Api.csproj LichSuDang.Api/
RUN dotnet restore LichSuDang.Api/LichSuDang.Api.csproj

# Copy toàn bộ source rồi publish
COPY . .
RUN dotnet publish LichSuDang.Api/LichSuDang.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---------- Runtime stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "LichSuDang.Api.dll"]
