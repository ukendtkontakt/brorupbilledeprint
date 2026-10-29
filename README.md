# Billede Print Dashboard

Et moderne, responsivt administrations- og regnskabssystem til fotoprint-forretning bygget med **Next.js (App Router)**, **React 19**, **Tailwind CSS v4** og **Lucide Icons**. 100% klar til deployment på **Vercel** og versionsstyring på **GitHub**.

---

## 🚀 Funktioner & Højdepunkter

### 1. Live KPI & Økonomi
- **Omsat**: Samlet omsætning på tværs af alle ordrer (opdelt på modtaget vs. udestående).
- **Profit minus slid**: Reel nettoindtjening efter fradrag af papir, toner og fragtomkostninger (`Omsat - (Printet i alt * Pris pr. print)`).
- **Printet i alt**: Samlet antal prints med beregning af gennemsnitspris.
- **Udestående (Skyldnere)**: Fremhævet rød tæller og beløb med direkte 1-klik filterfunktion.
- **Printer-Afbetaling**: Viser printerens startinvestering (1.000 kr.) med en dynamisk progress-bar, der tæller ned mod 0 kr. i restgæld i takt med den reelle profit.

### 2. Standardpriser & Mængdestaffel
- **Mængdestaffel (auto-udregnes ved oprettelse)**:
  - 1 stk: 8,00 kr./stk
  - 3 stk: 7,00 kr./stk
  - 5 stk: 6,00 kr./stk
  - 10 stk: 5,50 kr./stk
  - ≥ 20 stk: 5,00 kr./stk
- **Kontaktgruppe**: Fast 5,00 kr./stk uanset antal via toggle/checkbox.
- **Manuel overskrivelse**: Prisen pr. stk kan altid overskrives (f.eks. 0 kr., 3 kr., 3,5 kr.).

### 3. Toner-Tracker ("Antal print på hver toner")
- Fuld overblik over **Toner 1, Toner 2, Toner 3, Toner 4** (samt mulighed for at tilføje nye).
- Tydelige statusser:
  - **Færdig (Rød)**: Med påskriften *"Rød betyder den er færdig nu"*.
  - **Aktiv**: Highlightet badge; her registreres nye ordrer automatisk.
  - **Klar**: Reservepatroner klar til brug.
- Hurtig-knap på aktiv toner: **"Marker som færdig & aktiver næste toner"** (1 klik).
- Mulighed for manuel justering af tællere (+/-).

### 4. Lynhurtig Ordrehåndtering
- **1-klik betalingsstatus**: Tryk direkte på badge i tabellen (**Ja [Grøn]** / **Nej [Rød]**) på mobil eller computer for øjeblikkeligt at registrere betaling (inkl. konfetti-fejring).
- **Søgning og filtrering**: Søg på kundenavne eller noter i realtid. Slå "Vis kun manglende betalinger" til/fra med ét klik.
- **Rediger & Slet**: Fuld kontrol over eksisterende ordrer.

### 5. Datapersistens & Backup
- **LocalStorage**: Al data gemmes automatisk og persistent i browseren.
- **JSON Eksport / Import**: Tag fuld backup af ordrer, tonere og indstillinger med ét klik, eller gendan på en anden computer/telefon.
- **Excel CSV Eksport**: Download ordrer som semikolon-separeret CSV til direkte åbning i Excel / Google Sheets.
- **Gendan startdata**: Hurtig nulstilling til de 4 oprindelige testordrer (Folke, Teng, Johannes).

---

## 📊 Standard Startdata

| Kunde | Antal | Stk. pris | I alt | Betalt | Toner reference |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Folke** | 6 | 5,00 kr. | 30,00 kr. | 🔴 Nej | Toner 1 (4 stk) / Toner 2 (2 stk) |
| **Teng** | 1 | 0,00 kr. | 0,00 kr. | 🟢 Ja | Toner 2 (1 stk) |
| **Teng** | 12 | 3,00 kr. | 36,00 kr. | 🟢 Ja | Toner 2 (12 stk) |
| **Johannes** | 2 | 3,50 kr. | 7,00 kr. | 🟢 Ja | Toner 2 (2 stk) |

### Start-KPI'er
- **Omsat**: 73,00 kr.
- **Udestående**: 30,00 kr. (Folke)
- **Printet i alt**: 21 stk.
- **Omkostning pr. print**: `((170 × 2) + 39) / (2 × 108) = 379 / 216 = 1,7546296 kr.`
- **Profit minus slid**: `73 - (21 × 1,7546296) = 36,15 kr.`
- **Mangler at afdrage på printer**: `1000 - 36,15 = 963,85 kr.`

---

## 🛠️ Lokal Udvikling

```bash
# 1. Klon repository
git clone <dit-repo-url>
cd brorupbilledeprint

# 2. Installer dependencies
npm install

# 3. Start udviklingsserver
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

```bash
# Verificer linting og production build
npm run lint
npm run build
```

---

## 📦 Deploy til Vercel & GitHub

### 1. Push til GitHub
```bash
git add .
git commit -m "feat: Billede Print Dashboard med regnskab og tonerstyring"
git branch -M main
git remote add origin https://github.com/<dit-brugernavn>/<dit-repo-navn>.git
git push -u origin main
```

### 2. Deploy på Vercel
1. Gå til [vercel.com](https://vercel.com) og log ind med din GitHub-konto.
2. Vælg **"Add New..."** -> **"Project"**.
3. Vælg dit repository `brorupbilledeprint`.
4. Vercel genkender automatisk Next.js projektet. Klik blot på **"Deploy"**.
5. Efter under 1 minut er dit dashboard live på en lynhurtig `.vercel.app` URL med SSL!
