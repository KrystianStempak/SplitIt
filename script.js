//  INICJALIZACJA I STAN APLIKACJI
const currentUser = "Ja";
let groups = [];
let currentGroupId = null;

// PWA TRWAŁOŚĆ DANYCH: Bezpieczne ładowanie danych z pamięci urządzenia (LocalStorage)
try {
    const saved = localStorage.getItem('splitit_data');
    groups = saved ? JSON.parse(saved) : [];
} catch (e) {
    console.error("Błąd ładowania danych z LocalStorage", e);
    groups = [];
}

// Globalna funkcja zapisująca aktualny stan do pamięci i odświeżająca UI
function saveAndRender() {
    localStorage.setItem('splitit_data', JSON.stringify(groups));
    renderGroups();
    if (currentGroupId) {
        renderExpenses();
        renderSummary();
    }
}

const viewGroups = document.getElementById('view-groups');
const viewGroupDetails = document.getElementById('view-group-details');
const btnBack = document.getElementById('btn-back');
const groupsList = document.getElementById('groups-list');
const modalExpense = document.getElementById('modal-expense');
const modalGroup = document.getElementById('modal-group');

// OBSŁUGA TWORZENIA GRUPY
document.getElementById('btn-new-group').addEventListener('click', () => {
    // Czyszczenie pól przed otwarciem modala
    document.getElementById('input-group-name').value = '';
    document.getElementById('input-group-members').value = '';
    modalGroup.classList.remove('hidden');
});

document.getElementById('btn-cancel-group').addEventListener('click', () => {
    modalGroup.classList.add('hidden');
});

document.getElementById('btn-save-group').addEventListener('click', () => {
    const name = document.getElementById('input-group-name').value.trim();
    const membersRaw = document.getElementById('input-group-members').value;

    if (!name) {
        alert("Podaj nazwę grupy!");
        return;
    }

    // Dodanie zalogowanego użytkownika ("Ja") i formatowanie reszty
    const members = [currentUser, ...membersRaw.split(',').map(m => m.trim()).filter(m => m)];
    
    groups.push({
        id: Date.now(),
        name: name,
        members: members,
        expenses: []
    });
    
    saveAndRender();
    modalGroup.classList.add('hidden');
});

// NAWIGACJA I RENDEROWANIE WIDOKÓW

// Renderuje kafelki grup na ekranie głównym
function renderGroups() {
    groupsList.innerHTML = '';
    groups.forEach(group => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${group.name}</h3><p>${group.members.length} członków</p>`;
        div.onclick = () => openGroup(group.id); // Przejście do szczegółów grupy
        groupsList.appendChild(div);
    });
}

// Otwiera widok konkretnej grupy
function openGroup(id) {
    currentGroupId = id;
    const group = groups.find(g => g.id === id);
    document.getElementById('group-title').innerText = group.name;
    
    viewGroups.classList.add('hidden');
    viewGroupDetails.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    
    renderExpenses();
    renderSummary();
}

// Obsługa przycisku "Wróć"
btnBack.onclick = () => {
    viewGroups.classList.remove('hidden');
    viewGroupDetails.classList.add('hidden');
    btnBack.classList.add('hidden');
    currentGroupId = null;
};

// OBSŁUGA WYDATKÓW (TABS) Wewnątrz grupy
document.getElementById('tab-expenses').onclick = function() {
    this.classList.add('active'); 
    document.getElementById('tab-summary').classList.remove('active');
    document.getElementById('content-expenses').classList.remove('hidden');
    document.getElementById('content-summary').classList.add('hidden');
};

document.getElementById('tab-summary').onclick = function() {
    this.classList.add('active'); 
    document.getElementById('tab-expenses').classList.remove('active');
    document.getElementById('content-summary').classList.remove('hidden');
    document.getElementById('content-expenses').classList.add('hidden');
    renderSummary();
};

// OBSŁUGA WYDATKÓW (DODAWANIE I RENDEROWANIE)

// Otwieranie okienka dodawania wydatku
document.getElementById('btn-add-expense').onclick = () => {
    const group = groups.find(g => g.id === currentGroupId);
    const select = document.getElementById('select-exp-payer');
    const checkboxes = document.getElementById('checkboxes-exp-split');
    
    // Czyszczenie formularza
    document.getElementById('input-exp-title').value = '';
    document.getElementById('input-exp-amount').value = '';
    document.getElementById('input-exp-photo').value = '';
    select.innerHTML = ''; 
    checkboxes.innerHTML = '';

    // Generowanie listy płatników i osób do podziału
    group.members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m; opt.innerText = m;
        select.appendChild(opt);
        
        const cb = document.createElement('div');
        cb.innerHTML = `<label><input type="checkbox" value="${m}" checked> ${m}</label>`;
        checkboxes.appendChild(cb);
    });
    modalExpense.classList.remove('hidden');
};

document.getElementById('btn-cancel-expense').onclick = () => modalExpense.classList.add('hidden');

// Zapisywanie wydatku wraz z obsługą zdjęcia
document.getElementById('btn-save-expense').onclick = async () => {
    const title = document.getElementById('input-exp-title').value;
    const amount = parseFloat(document.getElementById('input-exp-amount').value);
    const photoFile = document.getElementById('input-exp-photo').files[0];
    const payer = document.getElementById('select-exp-payer').value;
    const splitAmong = Array.from(document.querySelectorAll('#checkboxes-exp-split input:checked')).map(c => c.value);

    if(!title || isNaN(amount)) return alert("Wpisz tytuł i kwotę!");
    if(splitAmong.length === 0) return alert("Wybierz przynajmniej jedną osobę do podziału!");

    // Konwersja zdjęcia z aparatu na Base64 (aby móc zapisać w LocalStorage)
    let photoBase64 = null;
    if(photoFile) {
        photoBase64 = await new Promise(r => {
            const rd = new FileReader(); 
            rd.onload = () => r(rd.result); 
            rd.readAsDataURL(photoFile);
        });
    }

    const group = groups.find(g => g.id === currentGroupId);
    group.expenses.push({ id: Date.now(), title, amount, payer, splitAmong, photo: photoBase64 });
    
    saveAndRender();
    modalExpense.classList.add('hidden');
};

// Renderowanie listy wydatków
function renderExpenses() {
    const group = groups.find(g => g.id === currentGroupId);
    const list = document.getElementById('expenses-list');
    list.innerHTML = '';
    
    group.expenses.forEach(exp => {
        const div = document.createElement('div');
        div.className = 'card expense-card';
        div.innerHTML = `
            <div style="flex: 1;">
                <h4>${exp.title}</h4>
                <p class="expense-info">Płacił: ${exp.payer}</p>
                ${exp.photo ? `<span style="font-size: 11px; color: #0056b3;">📷 Kliknij, by zobaczyć paragon</span>` : ''}
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                <div class="expense-amount">${exp.amount.toFixed(2)} PLN</div>
                <button onclick="event.stopPropagation(); window.deleteExpense(${exp.id})" 
                        class="btn-delete-expense">Usuń</button>
            </div>
        `;
        
        // Obsługa podglądu zdjęcia paragonu
        div.onclick = (e) => {
            if(exp.photo && e.target.tagName !== 'BUTTON') {
                document.getElementById('receipt-preview').src = exp.photo;
                document.getElementById('modal-receipt').classList.remove('hidden');
            }
        };
        list.appendChild(div);
    });
}

// SILNIK ROZLICZEŃ
function renderSummary() {
    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;

    let balances = {};
    group.members.forEach(m => balances[m] = 0);

    // Obliczanie bilansów netto
    group.expenses.forEach(exp => {
        balances[exp.payer] += exp.amount; // Plus dla płatnika
        const perPerson = exp.amount / exp.splitAmong.length;
        exp.splitAmong.forEach(p => balances[p] -= perPerson); // Minus dla dłużników
    });

    // Aktualizacja wizualna głównego bilansu
    const myBal = balances[currentUser] || 0;
    const myBalEl = document.getElementById('my-total-balance');
    myBalEl.innerText = `${myBal > 0 ? '+' : ''}${myBal.toFixed(2)} PLN`;
    myBalEl.className = myBal >= 0 ? 'positive' : 'negative';

    // Wyświetlanie bilansów wszystkich członków grupy
    let summaryHTML = '<h4>Bilanse członków:</h4><ul class="list" style="margin-bottom: 20px;">';
    for (const [name, balance] of Object.entries(balances)) {
        const colorClass = balance >= 0 ? 'positive' : 'negative';
        summaryHTML += `<li><span>${name}</span><span class="${colorClass}">${balance > 0 ? '+' : ''}${balance.toFixed(2)} PLN</span></li>`;
    }
    summaryHTML += '</ul>';

    // Algorytm minimalizujący liczbę przelewów
    let debtors = [];
    let creditors = [];

    for (const [name, balance] of Object.entries(balances)) {
        if (balance < -0.01) debtors.push({ name, amount: Math.abs(balance) });
        else if (balance > 0.01) creditors.push({ name, amount: balance });
    }

    let transactions = [];
    let d = 0, c = 0;

    while (d < debtors.length && c < creditors.length) {
        let amount = Math.min(debtors[d].amount, creditors[c].amount);
        
        transactions.push(`
            <li style="align-items: center;">
                <span style="flex: 1;"><b>${debtors[d].name}</b> ➔ <b>${creditors[c].name}</b>: ${amount.toFixed(2)} PLN</span>
                <button style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 13px;" 
                onclick="window.settleDebt('${debtors[d].name}', '${creditors[c].name}', ${amount})">Spłać</button>
            </li>
        `);
        
        debtors[d].amount -= amount;
        creditors[c].amount -= amount;

        if (debtors[d].amount < 0.01) d++;
        if (creditors[c].amount < 0.01) c++;
    }

    // Renderowanie sugerowanych przelewów
    summaryHTML += '<h4>Sugerowane rozliczenia:</h4><ul class="list">';
    if (transactions.length === 0) {
        summaryHTML += '<li style="justify-content: center; color: #28a745; font-weight: bold; padding: 15px; font-size: 16px;">Wszystko jest uregulowane! 🎉</li>';
    } else {
        summaryHTML += transactions.join('');
    }
    summaryHTML += '</ul>';

    // Przycisk usuwania grupy z weryfikacją rozliczenia
    const isSettled = transactions.length === 0;
    const buttonStyle = isSettled 
        ? "background: #fff0f0; color: #dc3545; border: 1px solid #f5c6cb; margin-top: 30px; font-size: 14px; cursor: pointer;" 
        : "background: #e9ecef; color: #6c757d; border: 1px solid #ced4da; margin-top: 30px; font-size: 14px; cursor: not-allowed;";
        
    const disabledAttr = isSettled ? "" : "disabled";

    summaryHTML += `
        <button onclick="window.deleteGroup(${currentGroupId})" class="btn-secondary" 
                style="${buttonStyle}" ${disabledAttr}>
                Usuń tę grupę
        </button>
    `;

    document.getElementById('transfers-list').innerHTML = summaryHTML;
}

// Uruchomienie aplikacji
renderGroups();


// Obsługa spłaty długu
window.settleDebt = function(debtorName, creditorName, amount) {
    const group = groups.find(g => g.id === currentGroupId);
    
    group.expenses.push({
        id: Date.now(),
        title: `Rozliczenie długu`,
        amount: amount,
        payer: debtorName,
        splitAmong: [creditorName],
        photo: null
    });
    saveAndRender();
};

// Usuwanie pojedynczego wydatku
window.deleteExpense = function(expId) {
    const group = groups.find(g => g.id === currentGroupId);
    group.expenses = group.expenses.filter(e => e.id !== expId);
    saveAndRender();
};

// Usuwanie całej grupy
window.deleteGroup = function(groupId) {
    const group = groups.find(g => g.id === groupId);
    
    let balances = {};
    group.members.forEach(m => balances[m] = 0);
    group.expenses.forEach(exp => {
        balances[exp.payer] += exp.amount;
        const perPerson = exp.amount / exp.splitAmong.length;
        exp.splitAmong.forEach(p => balances[p] -= perPerson);
    });
    
    const isSettled = Object.values(balances).every(b => Math.abs(b) < 0.01);
    
    if (isSettled) {
        // Twarde usunięcie z tablicy globalnej i pamięci localStorage
        groups = groups.filter(g => g.id !== groupId);
        localStorage.setItem('splitit_data', JSON.stringify(groups)); 
        
        // Reset interfejsu
        viewGroups.classList.remove('hidden');
        viewGroupDetails.classList.add('hidden');
        btnBack.classList.add('hidden');
        currentGroupId = null;
        
        renderGroups();
    }
};