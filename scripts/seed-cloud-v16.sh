#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-$HOME/Desktop/tindog}"
cd "$TARGET"

SUPABASE_URL_VALUE="https://vneedjbuaxarlvszvbfp.supabase.co"

echo "TinDog cloud seed"
echo "Project: $SUPABASE_URL_VALUE"
echo ""
echo "הדביקי עכשיו את ה-Secret key של הפרויקט."
echo "הטקסט לא יוצג על המסך ולא יישמר בפקודה."
printf "Secret key: "
IFS= read -r -s SECRET_KEY
printf "\n"

if [ -z "$SECRET_KEY" ]; then
  echo "❌ לא הוזן Secret key."
  exit 1
fi

SUPABASE_URL="$SUPABASE_URL_VALUE" \
SUPABASE_SERVICE_ROLE_KEY="$SECRET_KEY" \
node scripts/seed.mjs

unset SECRET_KEY

echo ""
echo "✅ Cloud seed finished."
