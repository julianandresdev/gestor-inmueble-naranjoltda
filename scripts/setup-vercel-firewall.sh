#!/usr/bin/env bash
# ==============================================================================
# Script de Configuración del Web Application Firewall (WAF) en Vercel
# Proyecto: gestor-inmueble-naranjoltda
# Uso exclusivo interno: Inmobiliaria Naranjo Ltda
# ==============================================================================

set -euo pipefail

echo "==> Verificando CLI de Vercel..."
if ! command -v vercel &> /dev/null; then
  echo "Error: Vercel CLI no está instalado o no se encuentra en el PATH."
  exit 1
fi

echo "==> Estado actual del Firewall en Vercel:"
vercel firewall status

echo ""
echo "==> Reglas activas actualmente:"
vercel firewall rules list

echo ""
echo "Para gestionar las reglas:"
echo " - Inspeccionar regla Colombia: vercel firewall rules inspect 'Solo Colombia'"
echo " - Inspeccionar rate limit:    vercel firewall rules inspect 'Rate Limit Auth'"
echo " - Ver tráfico bloqueado:       vercel firewall traffic list"
echo " - Descartar cambios draft:     vercel firewall discard --yes"
echo " - Publicar cambios:            vercel firewall publish --yes"
