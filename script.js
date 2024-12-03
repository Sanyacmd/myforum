// Хранилище пользователей, тем и забаненных
const users = JSON.parse(localStorage.getItem('users')) || [];
const topics = JSON.parse(localStorage.getItem('topics')) || [];
const bannedUsers = JSON.parse(localStorage.getItem('bannedUsers')) || [];

// Текущий пользователь
const currentUserEmail = localStorage.getItem('currentUser');
const currentUser = users.find(user => user.email === currentUserEmail);

// Проверка бана
function isUserBanned(email) {
    const banInfo = bannedUsers.find(ban => ban.email === email);
    if (!banInfo) return false;

    if (Date.now() > banInfo.banEndTime) {
        // Удаляем истекший бан
        const banIndex = bannedUsers.findIndex(ban => ban.email === email);
        bannedUsers.splice(banIndex, 1);
        localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
        return false;
    }

    return true;
}

// Отображение уведомления о бане
function notifyBan() {
    const banInfo = bannedUsers.find(ban => ban.email === currentUserEmail);
    if (banInfo) {
        alert(
            `Вы забанены!\nПричина: ${banInfo.reason}\nСрок: ${banInfo.duration} минут.\nПодождите окончания бана.`
        );
    }
}

// Регистрация
document.getElementById('registration-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !email || !password) {
        alert('Заполните все поля!');
        return;
    }

    if (users.some(user => user.email === email)) {
        alert('Пользователь с таким email уже зарегистрирован!');
        return;
    }

    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', email);

    document.querySelector('.registration').style.display = 'none';
    document.querySelector('.new-topic').style.display = 'block';
    document.querySelector('.topics').style.display = 'block';

    if (email === 'alexanbryashkin@gmail.com') {
        document.querySelector('.admin-console').style.display = 'block';
    }

    alert(`Пользователь ${username} успешно зарегистрирован!`);
});

// Проверка текущего пользователя при загрузке
if (currentUserEmail) {
    document.querySelector('.registration').style.display = 'none';

    if (!isUserBanned(currentUserEmail)) {
        document.querySelector('.new-topic').style.display = 'block';
        document.querySelector('.topics').style.display = 'block';
    } else {
        notifyBan();
    }

    if (currentUserEmail === 'alexanbryashkin@gmail.com') {
        document.querySelector('.admin-console').style.display = 'block';
    }
}

// Добавление темы
document.getElementById('new-topic-form').addEventListener('submit', function (event) {
    event.preventDefault();

    if (isUserBanned(currentUserEmail)) {
        alert('Вы забанены и не можете создавать темы.');
        return;
    }

    const title = document.getElementById('topic-title').value.trim();
    const content = document.getElementById('topic-content').value.trim();

    if (!title || !content) {
        alert('Заполните все поля!');
        return;
    }

    topics.push({ title, content, author: currentUserEmail });
    localStorage.setItem('topics', JSON.stringify(topics));

    alert('Тема успешно создана!');
    renderTopics();
});

// Рендер тем
function renderTopics() {
    const topicsList = document.getElementById('topics-list');
    topicsList.innerHTML = '';

    topics.forEach((topic, index) => {
        const topicDiv = document.createElement('div');
        topicDiv.className = 'topic';
        topicDiv.innerHTML = `
            <h3>${topic.title}</h3>
            <p>${topic.content}</p>
            <small>Автор: ${topic.author}</small>
        `;

        if (currentUserEmail === 'alexanbryashkin@gmail.com') {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Удалить';
            deleteButton.className = 'delete-button';
            deleteButton.setAttribute('data-index', index);

            deleteButton.addEventListener('click', function () {
                topics.splice(index, 1);
                localStorage.setItem('topics', JSON.stringify(topics));
                renderTopics();
            });

            topicDiv.appendChild(deleteButton);
        }

        topicsList.appendChild(topicDiv);
    });
}

// Обработка команды /ban
const adminBanButton = document.getElementById('admin-ban');
if (adminBanButton) {
    adminBanButton.addEventListener('click', function () {
        const banCommand = document.getElementById('admin-ban-input').value.trim();
        const [command, email, duration, ...reasonParts] = banCommand.split(' ');
        const reason = reasonParts.join(' ');

        if (command !== '/ban' || !email || !duration || !reason) {
            alert('Введите корректную команду. Пример: /ban [Email] [насколько] [причина]');
            return;
        }

        const userToBan = users.find(user => user.email === email);
        if (!userToBan) {
            alert('Пользователь с таким email не найден.');
            return;
        }

        const banEndTime = Date.now() + parseInt(duration, 10) * 60 * 1000;
        bannedUsers.push({ email, reason, duration, banEndTime });
        localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));

        alert(`Пользователь ${email} был забанен на ${duration} минут. Причина: ${reason}`);
    });
}

// Рендер тем при загрузке страницы
document.addEventListener('DOMContentLoaded', renderTopics);
