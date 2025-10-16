#!/bin/bash
echo "=== CAŁY KOD PROJEKTU ===" > ALL_CODE.txt
echo "" >> ALL_CODE.txt

# App files
echo "=== src/app/ ===" >> ALL_CODE.txt
find src/app -name "*.tsx" -o -name "*.ts" | sort | while read file; do
  echo "--- $file ---" >> ALL_CODE.txt
  cat "$file" >> ALL_CODE.txt
  echo -e "\n\n" >> ALL_CODE.txt
done

# Components
echo "=== src/components/ ===" >> ALL_CODE.txt
find src/components -name "*.tsx" -o -name "*.ts" | sort | while read file; do
  echo "--- $file ---" >> ALL_CODE.txt
  cat "$file" >> ALL_CODE.txt
  echo -e "\n\n" >> ALL_CODE.txt
done

# Hooks, lib, types, utils
echo "=== src/hooks/ src/lib/ src/types/ src/utils/ ===" >> ALL_CODE.txt
find src/hooks src/lib src/types src/utils -name "*.tsx" -o -name "*.ts" 2>/dev/null | sort | while read file; do
  echo "--- $file ---" >> ALL_CODE.txt
  cat "$file" >> ALL_CODE.txt
  echo -e "\n\n" >> ALL_CODE.txt
done

# Config files
echo "=== CONFIG FILES ===" >> ALL_CODE.txt
for file in package.json tailwind.config.js tailwind.config.ts tsconfig.json next.config.js postcss.config.js postcss.config.mjs eslint.config.mjs .env.local .gitignore README.md; do
  if [ -f "$file" ]; then
    echo "--- $file ---" >> ALL_CODE.txt
    cat "$file" >> ALL_CODE.txt
    echo -e "\n\n" >> ALL_CODE.txt
  fi
done

echo "KOD ZAPISANY W ALL_CODE.txt"
