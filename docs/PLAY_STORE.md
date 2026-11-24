# Pubblicare l'app su Google Play

L'app web e' ora una PWA installabile. Su Google Play si pubblica come
**Trusted Web Activity (TWA)**: un'app Android che apre il sito a schermo
intero, senza barra del browser. Ogni aggiornamento del sito arriva subito
anche nell'app, senza ripubblicare.

## Cosa c'e' gia' nel progetto

| Requisito | Dove |
|-----------|------|
| Manifest web (nome, icone, colori, scorciatoie) | `app/manifest.ts` -> `/manifest.webmanifest` |
| Icone 192/512 normali e maskable, icona Apple | `public/icons/` |
| Service worker con pagina offline | `public/sw.js`, `public/offline.html` |
| Verifica del dominio per Android | `/.well-known/assetlinks.json` (`app/api/assetlinks/route.ts`) |
| Informativa privacy pubblica | `/privacy` |
| Eliminazione account in-app (obbligatoria su Play) | `/dashboard/account` + `app/api/account/delete/route.ts` |
| Configurazione del wrapper Android | `android/twa-manifest.json` |

Nome e descrizione dell'app si cambiano in un solo punto: `lib/brand.ts`
(e i campi `name` / `launcherName` di `android/twa-manifest.json`).

## Passi da fare (richiedono il tuo account e le tue chiavi)

1. **Account sviluppatore Google Play** (25 USD una tantum). Gli account
   personali nuovi devono fare un test chiuso con 12 tester per 14 giorni
   prima di poter pubblicare in produzione.
2. **Variabili su Vercel** (poi redeploy):
   - `NEXT_PUBLIC_LEGAL_OWNER` = ragione sociale / nome del titolare (compare in `/privacy`)
   - `NEXT_PUBLIC_CONTACT_EMAIL` = email per privacy e assistenza
   - `SUPABASE_SERVICE_ROLE_KEY` = gia' usata dal form intake; serve anche per eliminare l'account
3. **Genera il pacchetto Android** su un PC con Node, JDK 17 e Android SDK:
   ```bash
   npm i -g @bubblewrap/cli
   cd android
   bubblewrap init --manifest=https://trainer-pro-phi.vercel.app/manifest.webmanifest   # oppure usa twa-manifest.json gia' pronto
   bubblewrap build        # crea app-release-bundle.aab e la chiave android.keystore
   ```
   Conserva `android.keystore` e le password fuori dal repository (sono gia' in `.gitignore`).
   Alternativa senza installare nulla: https://www.pwabuilder.com -> inserisci l'URL -> "Package for stores" -> Android.
4. **Carica l'`.aab`** in Play Console (test interno), poi copia l'impronta
   SHA-256 da *Configurazione > Integrita' dell'app > Firma dell'app*.
5. **Collega dominio e app** impostando su Vercel:
   - `ANDROID_PACKAGE_NAME` = `app.recstudio.twa` (lo stesso di `twa-manifest.json`)
   - `ANDROID_SHA256_CERT_FINGERPRINTS` = impronta di Play (e quella della chiave di upload, separate da virgola)

   Dopo il redeploy controlla che `https://<dominio>/.well-known/assetlinks.json`
   mostri il pacchetto. Finche' non combacia, l'app mostra la barra del browser.
6. **Scheda dello store**: icona 512 (`public/icons/icon-512.png`), immagine
   in evidenza 1024x500, almeno 2 screenshot da telefono, descrizione breve e completa.
7. **Moduli obbligatori in Play Console**:
   - Norme sulla privacy: `https://<dominio>/privacy`
   - Eliminazione account: `https://<dominio>/privacy#elimina-account`
   - Sicurezza dei dati: dichiara dati personali (nome, email), dati su salute e fitness, foto; cifrati in transito; eliminazione su richiesta
   - Classificazione dei contenuti, pubblico di destinazione (adulti), nessuna pubblicita'
   - Accesso all'app: fornisci a Google un account di prova (email e password) per la revisione
8. Invia in revisione.

## Materiale per la scheda (gia' pronto in `android/store/`)

- `icon-512.png` — icona dell'app
- `feature-graphic-1024x500.png` — immagine in evidenza
- `screenshot-1..4-*.png` — screenshot da telefono 1080x1920 con dati di esempio.
  Si rigenerano con `STORE_SHOTS=1 npm run test:e2e`.

Testi proposti:

- **Titolo** (max 30): `Ferrea: schede per PT`
- **Descrizione breve** (max 80): `Clienti, schede e progressi del personal trainer in un'unica app.`
- **Descrizione completa**:

  > Ferrea e' lo strumento di lavoro del personal trainer.
  >
  > - Schede di allenamento con superserie, cardio e progressioni gia' programmate settimana per settimana
  > - Link personale per ogni cliente: vede la scheda, registra carichi e ripetizioni, lascia un feedback
  > - Fasi, misurazioni, note e indicazioni alimentari generali
  > - Form iniziale per i nuovi clienti, preventivi ed export in PDF
  >
  > Demo gratuita con un cliente, senza carta di credito. Con Premium lavori con tutti i tuoi clienti.
  >
  > Le indicazioni alimentari sono generali e non sostituiscono il parere di un professionista sanitario.

- **Categoria**: Salute e fitness. **Pubblico**: adulti. **Annunci**: no.

## Piani, pagamenti e regole di Google Play

L'app ha due piani: demo gratuita (1 cliente) e Premium. Il trainer chiede
Premium dalla pagina Abbonamento; un super user verifica il pagamento e
approva da `/admin/premium`.

Google Play impone che gli acquisti di servizi digitali fatti **dentro**
un'app Android passino dalla fatturazione di Google Play (con commissione).
Per questo, quando il sito gira dentro l'app Android, la pagina Abbonamento
non mostra link di pagamento ne' IBAN: mostra solo il pulsante "Richiedi
Premium" e il pagamento si conclude fuori dall'app (email, sito web). Sul
sito web invece link e coordinate sono visibili.

Resta un punto da confermare prima della pubblicazione: il prezzo e' visibile
anche nell'app. Se Google dovesse contestarlo le strade sono due:
1. togliere dall'app Android ogni riferimento al prezzo (richiesta di contatto pura);
2. integrare Google Play Billing (o il programma di fatturazione alternativa
   disponibile nello Spazio Economico Europeo).

Dati di pagamento: si inseriscono come variabili su Vercel, senza toccare il codice.

| Variabile | A cosa serve |
|-----------|--------------|
| `NEXT_PUBLIC_PREMIUM_PRICE` | prezzo mensile mostrato (ora `29`, valore provvisorio) |
| `NEXT_PUBLIC_PAYMENT_LINK` | link di pagamento online (Stripe, PayPal...) |
| `NEXT_PUBLIC_PAYMENT_IBAN`, `NEXT_PUBLIC_PAYMENT_HOLDER` | coordinate per il bonifico |
| `SUPERUSER_EMAILS` | facoltativa: gli admin si gestiscono nella tabella Supabase `user_roles` (migrazione 028) |

## Account di prova per la revisione di Google

In Play Console > Accesso all'app indica un account demo (email e password)
gia' con un cliente e una scheda, e un secondo account approvato Premium se
vuoi che i revisori vedano le funzioni complete.
