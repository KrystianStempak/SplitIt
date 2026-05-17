import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, query, where, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================================================
// 1. FIREBASE KONFIGURACJA
// ============================================================================
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBa7sKIsCsOvDxSsrYYoUzFHmS1hEHv-Lo",
  authDomain: "splitit-app1.firebaseapp.com",
  projectId: "splitit-app1",
  storageBucket: "splitit-app1.firebasestorage.app",
  messagingSenderId: "749647585039",
  appId: "1:749647585039:web:6f22e78bfde802f9f2287a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ============================================================================
// 2. ZMIENNE GLOBALNE I ELEMENTY UI
// ============================================================================
let groups = [];
let currentGroupId = null;

const viewLogin = document.getElementById('view-login');
const appHeader = document.getElementById('app-header');
const appMain = document.getElementById('app-main');
const viewGroups = document.getElementById('view-groups');
const viewGroupDetails = document.getElementById('view-group-details');
const btnBack = document.getElementById('btn-back');
const groupsList = document.getElementById('groups-list');
const modalExpense = document.getElementById('modal-expense');
const modalGroup = document.getElementById('modal-group');

// ============================================================================
// 3. LOGOWANIE I KOLEKCJA "USERS"
// ============================================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.globalCurrentUser = user.displayName || user.email.split('@')[0];
        
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            name: window.globalCurrentUser,
            lastLogin: serverTimestamp()
        }, { merge: true });

        viewLogin.classList.add('hidden');
        appHeader.classList.remove('hidden');
        appMain.classList.remove('hidden');
        
        if(!document.getElementById('btn-logout')) {
            const btnLogout = document.createElement('button');
            btnLogout.id = 'btn-logout';
            btnLogout.innerText = 'Wyloguj';
            btnLogout.style.cssText = 'margin-left: 10px; background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;';
            btnLogout.onclick = () => {
                signOut(auth);
                groups = [];
                currentGroupId = null;
            };
            appHeader.appendChild(btnLogout);
        }

        await loadAllData();
    } else {
        viewLogin.classList.remove('hidden');
        appHeader.classList.add('hidden');
        appMain.classList.add('hidden');
    }
});

document.getElementById('btn-login-email').addEventListener('click', async () => {
    const email = document.getElementById('input-email').value;
    const password = document.getElementById('input-password').value;
    if (!email || !password) return alert("Podaj email i hasło!");
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            try { await createUserWithEmailAndPassword(auth, email, password); alert("Utworzono konto!"); } 
            catch (regError) { alert("Błąd: " + regError.message); }
        } else { alert("Błąd: " + error.message); }
    }
});

document.getElementById('btn-login-google').addEventListener('click', async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { alert("Błąd logowania Google: " + error.message); }
});

// ============================================================================
// 4. POBIERANIE DANYCH Z CHMURY
// ============================================================================
async function loadAllData() {
    groups = [];
    const groupsSnap = await getDocs(collection(db, "groups"));
    
    for (const groupDoc of groupsSnap.docs) {
        let groupData = groupDoc.data();
        groupData.id = groupDoc.id;
        groupData.expenses = [];

        const q = query(collection(db, "expenses"), where("groupId", "==", groupDoc.id));
        const expSnap = await getDocs(q);
        expSnap.forEach(expDoc => {
            let expData = expDoc.data();
            expData.id = expDoc.id;
            groupData.expenses.push(expData);
        });
        groups.push(groupData);
    }
    
    renderGroups();
    
    if (currentGroupId) {
        if(groups.find(g => g.id === currentGroupId)) {
            renderExpenses();
            renderSummary();
        } else {
            currentGroupId = null;
        }
    }
}

// ============================================================================
// 5. OBSŁUGA GRUP
// ============================================================================
document.getElementById('btn-new-group').addEventListener('click', () => {
    document.getElementById('input-group-name').value = '';
    document.getElementById('input-group-members').value = '';
    modalGroup.classList.remove('hidden');
});

document.getElementById('btn-cancel-group').addEventListener('click', () => modalGroup.classList.add('hidden'));

document.getElementById('btn-save-group').addEventListener('click', async () => {
    const name = document.getElementById('input-group-name').value.trim();
    const membersRaw = document.getElementById('input-group-members').value;
    if (!name) return alert("Podaj nazwę grupy!");

    const members = [window.globalCurrentUser, ...membersRaw.split(',').map(m => m.trim()).filter(m => m)];
    
    await addDoc(collection(db, "groups"), {
        name: name,
        members: members,
        isSettled: false,
        createdAt: serverTimestamp()
    });
    
    modalGroup.classList.add('hidden');
    await loadAllData();
});

// ============================================================================
// 6. NAWIGACJA WIDOKÓW
// ============================================================================
function renderGroups() {
    groupsList.innerHTML = '';
    groups.forEach(group => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${group.name}</h3><p>${group.members.length} członków</p>`;
        div.onclick = () => openGroup(group.id);
        groupsList.appendChild(div);
    });
}

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

btnBack.onclick = () => {
    viewGroups.classList.remove('hidden');
    viewGroupDetails.classList.add('hidden');
    btnBack.classList.add('hidden');
    currentGroupId = null;
};

document.getElementById('tab-expenses').onclick = function() {
    this.classList.add('active'); document.getElementById('tab-summary').classList.remove('active');
    document.getElementById('content-expenses').classList.remove('hidden'); document.getElementById('content-summary').classList.add('hidden');
};

document.getElementById('tab-summary').onclick = function() {
    this.classList.add('active'); document.getElementById('tab-expenses').classList.remove('active');
    document.getElementById('content-summary').classList.remove('hidden'); document.getElementById('content-expenses').classList.add('hidden');
    renderSummary();
};

// ============================================================================
// 7. OBSŁUGA WYDATKÓW Z KOMPRESJĄ, GPS I WIBRACJAMI
// ============================================================================
document.getElementById('btn-add-expense').onclick = () => {
    const group = groups.find(g => g.id === currentGroupId);
    const select = document.getElementById('select-exp-payer');
    const checkboxes = document.getElementById('checkboxes-exp-split');
    
    document.getElementById('input-exp-title').value = '';
    document.getElementById('input-exp-amount').value = '';
    document.getElementById('input-exp-photo').value = '';
    select.innerHTML = ''; checkboxes.innerHTML = '';

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

document.getElementById('btn-save-expense').onclick = async () => {
    const title = document.getElementById('input-exp-title').value;
    const amount = parseFloat(document.getElementById('input-exp-amount').value);
    const photoFile = document.getElementById('input-exp-photo').files[0];
    const payer = document.getElementById('select-exp-payer').value;
    const splitAmong = Array.from(document.querySelectorAll('#checkboxes-exp-split input:checked')).map(c => c.value);

    if(!title || isNaN(amount)) return alert("Wpisz tytuł i kwotę!");
    if(splitAmong.length === 0) return alert("Wybierz przynajmniej jedną osobę do podziału!");

// FIZYCZNA FUNKCJA URZĄDZENIA 1: GPS (Geolokalizacja)
    let locationData = null;
    if ("geolocation" in navigator) {
        locationData = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
                },
                (error) => {
                    // Dodajemy alert, żebyś na własne oczy widział, dlaczego komputer nie pobrał GPS
                    alert("Informacja GPS: Przeglądarka nie mogła pobrać lokalizacji. Powód: " + error.message);
                    resolve(null); 
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 } // Wydłużamy czas do 15 sekund!
            );
        });
    }

    // FIZYCZNA FUNKCJA URZĄDZENIA 2: Kamera (zdjęcie zapisane z użyciem kompresji)
    let photoBase64 = null;
    if(photoFile) {
        photoBase64 = await new Promise(r => {
            const reader = new FileReader(); 
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600;
                    let scaleSize = MAX_WIDTH / img.width;
                    if(scaleSize > 1) scaleSize = 1;
                    canvas.width = img.width * scaleSize;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    r(canvas.toDataURL('image/jpeg', 0.6)); 
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(photoFile);
        });
    }

    await addDoc(collection(db, "expenses"), {
        groupId: currentGroupId,
        title: title,
        amount: amount, 
        payer: payer,
        splitAmong: splitAmong,
        photo: photoBase64,
        location: locationData // Zapis współrzędnych w chmurze
    });

    // FIZYCZNA FUNKCJA URZĄDZENIA 3: Wibracje (po udanym zapisie)
    if ("vibrate" in navigator) {
        navigator.vibrate(100); // 100 milisekund wibracji
    }
    
    modalExpense.classList.add('hidden');
    await loadAllData();
};

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
                ${exp.location ? `<a href="https://www.google.com/maps/search/?api=1&query=${exp.location.lat},${exp.location.lng}" target="_blank" style="font-size: 11px; color: #28a745; text-decoration: none; display: inline-block; margin-bottom: 3px;" onclick="event.stopPropagation();">📍 Zobacz miejsce zakupu na mapie</a><br>` : ''}
                ${exp.photo ? `<span style="font-size: 11px; color: #0056b3;">📷 Kliknij, by zobaczyć paragon</span>` : ''}
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                <div class="expense-amount">${exp.amount.toFixed(2)} PLN</div>
                <button onclick="event.stopPropagation(); window.deleteExpense('${exp.id}')" class="btn-delete-expense">Usuń</button>
            </div>
        `;
        div.onclick = (e) => {
            if(exp.photo && e.target.tagName !== 'BUTTON') {
                document.getElementById('receipt-preview').src = exp.photo;
                document.getElementById('modal-receipt').classList.remove('hidden');
            }
        };
        list.appendChild(div);
    });
}

// ============================================================================
// 8. SILNIK ROZLICZEŃ
// ============================================================================
function renderSummary() {
    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;

    let balances = {};
    group.members.forEach(m => balances[m] = 0);

    group.expenses.forEach(exp => {
        balances[exp.payer] += exp.amount;
        const perPerson = exp.amount / exp.splitAmong.length;
        exp.splitAmong.forEach(p => balances[p] -= perPerson);
    });

    const myBal = balances[window.globalCurrentUser] || 0;
    const myBalEl = document.getElementById('my-total-balance');
    myBalEl.innerText = `${myBal > 0 ? '+' : ''}${myBal.toFixed(2)} PLN`;
    myBalEl.className = myBal >= 0 ? 'positive' : 'negative';

    let summaryHTML = '<h4>Bilanse członków:</h4><ul class="list" style="margin-bottom: 20px;">';
    for (const [name, balance] of Object.entries(balances)) {
        const colorClass = balance >= 0 ? 'positive' : 'negative';
        summaryHTML += `<li><span>${name}</span><span class="${colorClass}">${balance > 0 ? '+' : ''}${balance.toFixed(2)} PLN</span></li>`;
    }
    summaryHTML += '</ul>';

    let debtors = [], creditors = [];
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
        debtors[d].amount -= amount; creditors[c].amount -= amount;
        if (debtors[d].amount < 0.01) d++; if (creditors[c].amount < 0.01) c++;
    }

    summaryHTML += '<h4>Sugerowane rozliczenia:</h4><ul class="list">';
    if (transactions.length === 0) {
        summaryHTML += '<li style="justify-content: center; color: #28a745; font-weight: bold; padding: 15px; font-size: 16px;">Wszystko jest uregulowane! 🎉</li>';
    } else {
        summaryHTML += transactions.join('');
    }
    summaryHTML += '</ul>';

    const isSettled = transactions.length === 0;
    const buttonStyle = isSettled ? "background: #fff0f0; color: #dc3545; border: 1px solid #f5c6cb; margin-top: 30px; font-size: 14px; cursor: pointer;" : "background: #e9ecef; color: #6c757d; border: 1px solid #ced4da; margin-top: 30px; font-size: 14px; cursor: not-allowed;";
    const disabledAttr = isSettled ? "" : "disabled";

    summaryHTML += `<button onclick="window.deleteGroup('${currentGroupId}')" class="btn-secondary" style="${buttonStyle}" ${disabledAttr}>Usuń tę grupę</button>`;
    document.getElementById('transfers-list').innerHTML = summaryHTML;
}

window.settleDebt = async function(debtorName, creditorName, amount) {
    await addDoc(collection(db, "expenses"), {
        groupId: currentGroupId,
        title: `Rozliczenie długu`,
        amount: amount,
        payer: debtorName,
        splitAmong: [creditorName],
        photo: null
    });
    
    // Potrójna wibracja potwierdzająca spłatę długu
    if ("vibrate" in navigator) {
        navigator.vibrate([50, 100, 50, 100, 50]); 
    }
    
    await loadAllData();
};

window.deleteExpense = async function(expId) {
    await deleteDoc(doc(db, "expenses", expId)); 
    await loadAllData();
};

window.deleteGroup = async function(groupId) {
    const group = groups.find(g => g.id === groupId);
    let balances = {};
    group.members.forEach(m => balances[m] = 0);
    group.expenses.forEach(exp => {
        balances[exp.payer] += exp.amount;
        const perPerson = exp.amount / exp.splitAmong.length;
        exp.splitAmong.forEach(p => balances[p] -= perPerson);
    });
    
    if (Object.values(balances).every(b => Math.abs(b) < 0.01)) {
        for (const exp of group.expenses) {
            await deleteDoc(doc(db, "expenses", exp.id));
        }
        await deleteDoc(doc(db, "groups", groupId)); 
        
        viewGroups.classList.remove('hidden'); viewGroupDetails.classList.add('hidden'); btnBack.classList.add('hidden');
        currentGroupId = null;
        await loadAllData();
    }
};