# SplitIt - System Mobilny do Rozliczania Wydatków Grupowych

SplitIt to aplikacja mobilna typu **PWA (Progressive Web App)** zaprojektowana do sprawnego zarządzania i optymalizacji wspólnych kosztów w grupach znajomych. Projekt został przygotowany w ramach przedmiotu **Programowanie Systemów Mobilnych**.

## 📱 Charakterystyka Projektu
Aplikacja wykorzystuje technologie webowe do stworzenia doświadczenia natywnej aplikacji mobilnej. Główne założenia techniczne to:
- **Mobile-First Design**: Interfejs zoptymalizowany pod ekrany dotykowe [cite: 4].
- **PWA (Progressive Web App)**: Aplikacja jest instalowalna na ekranie głównym telefonu i posiada własny manifest [cite: 2].
- **Praca Offline**: Dzięki Service Workerowi aplikacja ładuje się i działa bez dostępu do sieci [cite: 5].
- **Dostęp do Sprzętu**: Wykorzystanie systemowego aparatu fotograficznego do dokumentowania paragonów [cite: 1].

## 🚀 Kluczowe Funkcjonalności

### 1. Zarządzanie Grupami
- Tworzenie dedykowanych grup wydatków z listą uczestników [cite: 1, 3].
- Trwałość danych: Wszystkie grupy i wydatki są zapisywane w pamięci lokalnej urządzenia (**LocalStorage**), co zapobiega ich utracie po zamknięciu przeglądarki [cite: 3].
- Możliwość usunięcia grupy po jej całkowitym rozliczeniu [cite: 3].

### 2. Ewidencja Wydatków z Dokumentacją
- Dodawanie wydatków z określeniem płatnika i osób biorących udział w koszcie [cite: 3].
- **Obsługa Aparatu**: Możliwość zrobienia zdjęcia paragonu bezpośrednio przy dodawaniu wydatku (atrybut `capture="camera"`) [cite: 1].
- Przechowywanie zdjęć w formacie **Base64**, co pozwala na ich lokalny zapis bez zewnętrznego serwera [cite: 3].
- Interaktywny podgląd załączonych paragonów po kliknięciu w kartę wydatku [cite: 1, 3].

### 3. Zaawansowany Silnik Rozliczeń
- **Bilans Netto**: System na bieżąco oblicza, ile każdy uczestnik wydał w stosunku do tego, ile powinien [cite: 3].
- **Algorytm Optymalizacji (Greedy Algorithm)**: Aplikacja automatycznie paruje dłużników z wierzycielami, minimalizując liczbę niezbędnych przelewów zwrotnych [cite: 3].
- **Szybkie Spłaty**: Funkcja "Spłać" pozwala na błyskawiczne uregulowanie sugerowanego długu poprzez wygenerowanie transakcji korygującej [cite: 3].

## 🛠️ Stos Technologiczny
- **Frontend**: HTML5 (Struktura semantyczna), CSS3 (Flexbox, Mobile Design).
- **Logika**: Vanilla JavaScript (ES6+) - brak zewnętrznych bibliotek dla zachowania lekkości.
- **Mobile/PWA**: 
  - `manifest.json`: Definicja kolorów, ikon i trybu wyświetlania [cite: 2].
  - `sw.js`: Service Worker zarządzający cache'owaniem plików statycznych [cite: 5].
  - `LocalStorage`: Przechowywanie stanów aplikacji i zdjęć [cite: 3].

## 📖 Instrukcja Obsługi
1. **Instalacja**: Otwórz aplikację w przeglądarce mobilnej i wybierz opcję "Dodaj do ekranu głównego".
2. **Nowa Grupa**: Kliknij "Utwórz nową grupę" i wpisz imiona znajomych (np. Ja, Jan, Anna).
3. **Dodawanie wydatku**: Wejdź w grupę i dodaj wydatek. Wybierz "Wybierz plik", aby uruchomić aparat i sfotografować paragon.
4. **Rozliczenie**: W zakładce "Podsumowanie" sprawdź sugerowane przelewy. Kliknij "Spłać", aby uregulować dług.
5. **Porządki**: Po uregulowaniu wszystkich długów przycisk "Usuń tę grupę" stanie się aktywny, umożliwiając zamknięcie projektu.

---
*Projekt zrealizowany przez studenta III roku Informatyki Stosowanej.*
