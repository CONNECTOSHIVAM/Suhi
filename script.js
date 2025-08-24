// Import Google Generative AI library
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI("AIzaSyB9-r28ZUGt7swHJQyImvI1xsC1vOhwT6M");

// College data containing schedule and detailed information
const collegeData = {
  schedule: [
    ["Monday", "09:30-10:20", "Computer Network", "Keshab Sir", "Lab 1", "lecture"],
    ["Monday", "11:10-12:00", "Algorithm Lab", "Sunidhi Mam", "Computer Lab", "lab", "Group 1"],
    ["Monday", "14:20-15:10", "Sports/Painting/Music", "Arindum Sir", "Sports Complex", "activity"],
    ["Tuesday", "09:30-10:20", "Algorithm", "Sunidhi Mam", "Room 211", "lecture"],
    ["Tuesday", "10:20-11:10", "Advanced Programming", "Amit Sir", "Room 205", "lecture"],
    ["Tuesday", "11:10-12:00", "Machine Learning", "Keshab Sir", "Room 203", "lecture"],
    ["Tuesday", "12:20-13:10", "Maths Modelling", "RKB Gupta Sir", "Room 204", "lecture"],
    ["Tuesday", "14:20-15:10", "Algorithm Lab", "Sunidhi Mam", "Computer Lab", "lab", "Group 2"],
    ["Wednesday", "09:30-10:20", "Advanced Programming", "Amit Sir", "Room 205", "lecture"],
    ["Wednesday", "10:30-11:20", "Operating System", "Ranadeep Sir", "Room 205", "lecture"],
    ["Wednesday", "11:30-12:20", "Finance", "Anwesha Mam", "Room 206", "lecture"],
    ["Wednesday", "12:30-14:20", "Operating System Lab", "Ranadeep Sir", "OS Lab", "lab", "Group 2"],
    ["Thursday", "09:30-10:30", "Algorithm", "Sunidhi Mam", "Room 211", "lecture"],
    ["Thursday", "10:30-11:20", "Career Advancement", "Anutosh Sir", "Seminar Hall", "seminar"],
    ["Thursday", "11:30-12:20", "Advanced Programming Lab", "Amit Sir", "Programming Lab", "lab", "Group 2"],
    ["Thursday", "12:30-13:20", "Maths Modelling", "RKB Gupta Sir", "Room 204", "lecture"],
    ["Friday", "09:30-10:20", "Operating System", "Ranadeep Sir", "Room 205", "lecture"],
    ["Friday", "10:30-11:20", "Career Advancement", "Anutosh Sir", "Seminar Hall", "seminar"],
    ["Friday", "14:20-15:10", "Maths Modelling", "RKB Gupta Sir", "Room 204", "lecture"],
    ["Friday", "15:30-17:20", "Operating System Lab", "Ranadeep Sir", "OS Lab", "lab", "Group 1"]
  ],
  collegeInfo: `
# Dumka Engineering College (DEC) - Comprehensive Overview
...
  ` // Truncated for brevity, full college info as in original
};

// Daily routine markdown
const dailyRoutine = `
# A Typical Day at Dumka Engineering College
...
`; // Truncated for brevity, full routine as in original

// DOM elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const imageInput = document.getElementById('imageInput');
const themeToggle = document.getElementById('themeToggle');
const remindersBtn = document.getElementById('remindersBtn');
const remindersModal = document.getElementById('remindersModal');
const remindersList = document.getElementById('remindersList');

// State variables
let conversationHistory = JSON.parse(localStorage.getItem('suhi-conversation')) || [];
let reminders = JSON.parse(localStorage.getItem('suhi-reminders')) || [];
let currentImageFile = null;
let lastUserMessage = null;

// Initialize the application
function initializeApp() {
  loadTheme();
  setupEventListeners();
  loadConversation();
  setTimeout(() => {
    showNotification("Welcome to Suhi! Your AI assistant is ready to help with college and general queries. 😊");
  }, 1000);
  checkUpcomingReminders();
}

// Theme management
function loadTheme() {
  const savedTheme = localStorage.getItem('suhi-theme') || 'dark';
  document.body.className = `bg-gradient-to-br from-dark via-slate-900 to-slate-800 text-white min-h-screen overflow-hidden ${savedTheme}-theme`;
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.className = `bg-gradient-to-br from-dark via-slate-900 to-slate-800 text-white min-h-screen overflow-hidden ${newTheme}-theme`;
  localStorage.setItem('suhi-theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Event listeners setup
function setupEventListeners() {
  themeToggle.addEventListener('click', toggleTheme);
  remindersBtn.addEventListener('click', showRemindersModal);
  messageInput.addEventListener('input', autoResizeTextarea);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  imageInput.addEventListener('change', handleImageUpload);
  chatContainer.addEventListener('scroll', handleScroll);
}

function handleScroll() {
  const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 10;
}

function loadConversation() {
  conversationHistory.forEach(msg => {
    addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot', msg.role === 'assistant');
  });
}

// Global functions for HTML buttons
window.sendQuickMessage = function(message) {
  messageInput.value = message;
  sendMessage();
};

window.sendMessage = async function() {
  const message = messageInput.value.trim();
  if (!message && !currentImageFile) return;

  messageInput.disabled = true;
  sendButton.disabled = true;

  addMessage(message, 'user');
  messageInput.value = '';
  messageInput.style.height = 'auto';

  showTypingIndicator();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are Suhi, an AI assistant powered developed by Connecto Shivam for Dumka Engineering College and general knowledge queries. Be friendly, helpful, and professional. Use emojis where appropriate 😊.
...
`; // Truncated for brevity, full prompt as in original

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || "Sorry, I couldn't generate a response.";
    
    hideTypingIndicator();
    
    addMessage(text, 'bot', true);
    
    if (isScheduleQuery(message)) {
      const day = extractDayFromQuery(message);
      if (day === 'Saturday' || day === 'Sunday') {
        addMessage(`Today is no class. General routine dekhna chahte ho? 😊`, 'bot');
      } else if (day && collegeData.schedule.some(item => item[0] === day)) {
        const scheduleDisplay = createScheduleDisplay(day, collegeData.schedule.filter(item => item[0] === day));
        chatContainer.appendChild(scheduleDisplay);
      } else if (day) {
        addMessage(`Aaj ${day} hai, aur is din koi classes nahi hain. General routine dekhna chahte ho? 😊`, 'bot');
      }
    }

    if (isMedicalQuery(message)) {
      const medicalInterface = createMedicalInterface();
      chatContainer.appendChild(medicalInterface);
    }

    if (isEventQuery(message)) {
      const date = extractDateFromQuery(message);
      if (date) {
        const events = getEventsForDate(date);
        if (events.length > 0) {
          const eventDisplay = createEventDisplay(date, events);
          chatContainer.appendChild(eventDisplay);
        }
      }
    }

    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: text }
    );

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    localStorage.setItem('suhi-conversation', JSON.stringify(conversationHistory));

  } catch (error) {
    console.error('Error:', error);
    hideTypingIndicator();
    addMessage("Sorry, I'm having trouble connecting. Please try again! 😅", 'bot');
  } finally {
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
  }
};

// Check if message is heartfelt for heart reaction
function isHeartfeltMessage(content) {
  const heartfeltKeywords = ['thanks', 'thank you', 'love', 'grateful', 'appreciate', 'dhanyavad', 'shukriya'];
  return heartfeltKeywords.some(keyword => content.toLowerCase().includes(keyword));
}

// Add a message to the chat container
function addMessage(content, type, isMarkdown = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`;
  
  const bubble = document.createElement('div');
  bubble.className = `message-bubble p-4 rounded-2xl ${type === 'user' ? 'user-message' : 'bot-message'}`;
  
  if (type === 'bot') {
    const avatar = document.createElement('div');
    avatar.className = 'flex items-start space-x-3';
    avatar.innerHTML = `
      <div class="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
        <img src="logo.png" alt="Suhi Logo" class="w-5 h-5" style="width: 100%; height: 100%;">
      </div>
      <div class="flex-1">${isMarkdown ? marked.parse(content) : content}</div>
    `;
    bubble.appendChild(avatar);
    if (lastUserMessage) {
      const ticks = lastUserMessage.querySelector('.read-ticks');
      if (ticks) {
        ticks.innerHTML = '<i class="fas fa-check"></i><i class="fas fa-check"></i>';
        ticks.classList.add('read');
      }
      if (isHeartfeltMessage(lastUserMessage.textContent)) {
        const heart = lastUserMessage.querySelector('.heart-reaction') || document.createElement('div');
        heart.className = 'heart-reaction';
        heart.innerHTML = '❤️';
        if (!lastUserMessage.querySelector('.heart-reaction')) {
          lastUserMessage.appendChild(heart);
        }
      }
    }
  } else {
    bubble.innerHTML = `
      ${isMarkdown ? marked.parse(content) : content}
      <div class="read-ticks"><i class="fas fa-check"></i></div>
    `;
    lastUserMessage = bubble;
  }
  
  messageDiv.appendChild(bubble);
  
  const quickActions = chatContainer.querySelector('.flex-wrap');
  if (quickActions && chatContainer.children.length <= 2) {
    chatContainer.insertBefore(messageDiv, quickActions.parentElement);
  } else {
    chatContainer.appendChild(messageDiv);
  }
  
  scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-message';
  typingDiv.className = 'flex justify-start animate-fade-in';
  typingDiv.innerHTML = `
    <div class="message-bubble bot-message p-4 rounded-2xl">
      <div class="flex items-start space-x-3">
        <div class="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
          <img src="logo.png" alt="Suhi Logo" class="w-5 h-5" style="width: 100%; height: 100%;">
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-gray-600 text-sm">Suhi is typing</span>
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms"></div>
            <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 150ms"></div>
            <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  chatContainer.appendChild(typingDiv);
  scrollToBottom();
}

function hideTypingIndicator() {
  const typingMsg = document.getElementById('typing-message');
  if (typingMsg) {
    typingMsg.remove();
  }
}

// Create schedule display
function createScheduleDisplay(day, schedule) {
  const scheduleDiv = document.createElement('div');
  scheduleDiv.classList.add('schedule-container');
  
  let scheduleHTML = `
    <div class="schedule-header">
      <div class="schedule-day">${day} Schedule</div>
      <i class="fas fa-calendar-alt"></i>
    </div>
  `;

  schedule.forEach(classInfo => {
    scheduleHTML += `
      <div class="schedule-item">
        <div class="schedule-time">${classInfo[1]}</div>
        <div class="schedule-details">
          <div class="schedule-subject">${classInfo[2]}</div>
          <div class="schedule-teacher">${classInfo[3]}</div>
          <div class="schedule-teacher">${classInfo[4]}${classInfo[6] ? `, Group: ${classInfo[6]}` : ''}</div>
        </div>
      </div>
    `;
  });

  scheduleHTML += `
    <div style="margin-top: 16px; padding: 12px; background: var(--primary-gradient); border-radius: 12px; color: white; text-align: center;">
      <i class="fas fa-bell"></i> क्या मैं classes का reminder set करूं?
      <div style="margin-top: 8px;">
        <button onclick="setClassReminders('${day}')" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin: 0 4px;">
          हाँ, Set करना
        </button>
        <button onclick="closeReminderOption(this)" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin: 0 4px;">
          नहीं, धन्यवाद
        </button>
      </div>
    </div>
  `;

  scheduleDiv.innerHTML = scheduleHTML;
  return scheduleDiv;
}

// Create event display
function createEventDisplay(date, events) {
  const eventDiv = document.createElement('div');
  eventDiv.classList.add('schedule-container');
  
  let eventHTML = `
    <div class="schedule-header">
      <div class="schedule-day">Tecurious Events - ${date}</div>
      <i class="fas fa-calendar-alt"></i>
    </div>
  `;

  events.forEach(event => {
    const timeMatch = event.match(/(\d{2}:\d{2}–\d{2}:\d{2} [AP]M)/);
    const eventName = event.match(/: (.*?)( –|$)/)[1];
    const location = event.match(/– (.*?)$/)[1];
    eventHTML += `
      <div class="schedule-item">
        <div class="schedule-time">${timeMatch[1]}</div>
        <div class="schedule-details">
          <div class="schedule-subject">${eventName}</div>
          <div class="schedule-teacher">${location}</div>
        </div>
      </div>
    `;
  });

  eventHTML += `
    <div style="margin-top: 16px; padding: 12px; background: var(--primary-gradient); border-radius: 12px; color: white; text-align: center;">
      <i class="fas fa-bell"></i> क्या मैं events का reminder set करूं?
      <div style="margin-top: 8px;">
        <button onclick="setEventReminders('${date}')" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin: 0 4px;">
          हाँ, Set करना
        </button>
        <button onclick="closeReminderOption(this)" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin: 0 4px;">
          नहीं, धन्यवाद
        </button>
      </div>
    </div>
  `;

  eventDiv.innerHTML = eventHTML;
  return eventDiv;
}

// Create medical interface
function createMedicalInterface() {
  const medicalDiv = document.createElement('div');
  medicalDiv.classList.add('medical-container');
  medicalDiv.innerHTML = `
    <div class="medical-header">
      <div class="medical-icon">
        <i class="fas fa-stethoscope"></i>
      </div>
      <div>
        <h3>AI Medical Assistant</h3>
        <p>Describe your symptoms or health concerns</p>
      </div>
    </div>
    <div class="symptoms-input">
      <div class="symptom-tag" onclick="addSymptom('headache')">Headache</div>
      <div class="symptom-tag" onclick="addSymptom('fever')">Fever</div>
      <div class="symptom-tag" onclick="addSymptom('cough')">Cough</div>
      <div class="symptom-tag" onclick="addSymptom('fatigue')">Fatigue</div>
      <div class="symptom-tag" onclick="addSymptom('nausea')">Nausea</div>
      <div class="symptom-tag" onclick="addSymptom('dizziness')">Dizziness</div>
    </div>
    <p style="font-size: 12px; opacity: 0.8; margin-top: 12px;">
      <i class="fas fa-info-circle"></i> This is for informational purposes only. Please consult a healthcare professional for proper medical advice.
    </p>
  `;
  return medicalDiv;
}

// Query type checks
function isScheduleQuery(message) {
  const scheduleKeywords = ['schedule', 'class', 'timetable', 'today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return scheduleKeywords.some(keyword => message.toLowerCase().includes(keyword)) && !isRoutineQuery(message);
}

function isRoutineQuery(message) {
  return message.toLowerCase().includes('routine') || message.toLowerCase().includes('typical day');
}

function isMedicalQuery(message) {
  const medicalKeywords = ['symptom', 'health', 'medical', 'doctor', 'pain', 'fever', 'headache', 'sick', 'medicine'];
  return medicalKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

function isEventQuery(message) {
  return message.toLowerCase().includes('tecurious') || message.toLowerCase().includes('event');
}

function extractDayFromQuery(message) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  if (message.toLowerCase().includes('today')) {
    return today;
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  
  if (message.toLowerCase().includes('tomorrow')) {
    return tomorrowDay;
  }

  for (const day of days) {
    if (message.toLowerCase().includes(day.toLowerCase())) {
      return day;
    }
  }
  
  return null;
}

function extractDateFromQuery(message) {
  const tecuriousDates = ['20 June 2025', '21 June 2025', '22 June 2025'];
  for (const date of tecuriousDates) {
    if (message.toLowerCase().includes(date.toLowerCase()) || message.toLowerCase().includes('tecurious')) {
      return date;
    }
  }
  return null;
}

function getEventsForDate(date) {
  const eventsMatch = collegeData.collegeInfo.match(new RegExp(`${date}:\\n([\\s\\S]*?)(\\n\\n|$)`));
  if (eventsMatch && eventsMatch[1]) {
    return eventsMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
  }
  return [];
}

// Utility functions
function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth'
  });
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    currentImageFile = file;
    const uploadBtn = document.querySelector('label[for="imageInput"]');
    uploadBtn.style.background = 'var(--primary-gradient)';
    uploadBtn.style.color = 'white';
    showNotification("File uploaded, but I can't process it yet. Try asking a question! 😊");
  }
}

// Reminder management
function setClassReminders(day) {
  const schedule = collegeData.schedule.filter(item => item[0] === day);
  const now = new Date();
  const today = now.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  
  schedule.forEach(classInfo => {
    const [classDay, time, subject, teacher, location] = classInfo;
    const [startTime] = time.split('-');
    const reminderTime = new Date(`${today} ${startTime}`);
    reminders.push({
      id: `class-${day}-${startTime}-${Date.now()}`,
      type: 'class',
      day,
      time: startTime,
      subject,
      location,
      timestamp: reminderTime.getTime()
    });
  });

  localStorage.setItem('suhi-reminders', JSON.stringify(reminders));
  updateRemindersList();
  addMessage(
    `✅ ${day} के लिए ${schedule.length} class reminders set किए गए हैं। 15 मिनट पहले notification आएगा!`,
    'bot'
  );
  showNotification(`Reminders set for ${day}'s classes!`);
  scrollToBottom();
}

function setEventReminders(date) {
  const events = getEventsForDate(date);
  const now = new Date();
  events.forEach(event => {
    const timeMatch = event.match(/(\d{2}:\d{2}–\d{2}:\d{2} [AP]M)/);
    if (timeMatch) {
      const eventTime = timeMatch[1].split('–')[0];
      const eventName = event.match(/: (.*?)( –|$)/)[1];
      const reminderTime = new Date(`${date} ${eventTime}`);
      reminders.push({
        id: `event-${date}-${eventTime}-${Date.now()}`,
        type: 'event',
        date,
        time: eventTime,
        name: eventName,
        timestamp: reminderTime.getTime()
      });
    }
  });

  localStorage.setItem('suhi-reminders', JSON.stringify(reminders));
  updateRemindersList();
  addMessage(
    `✅ ${date} के लिए Tecurious event reminders set किए गए हैं। 15 मिनट पहले notification आएगा!`,
    'bot'
  );
  showNotification(`Reminders set for ${date}'s Tecurious events!`);
  scrollToBottom();
}

function updateRemindersList() {
  remindersList.innerHTML = '';
  if (reminders.length === 0) {
    remindersList.innerHTML = '<p class="text-gray-400 text-sm">No reminders set.</p>';
    return;
  }

  reminders.sort((a, b) => a.timestamp - b.timestamp);
  reminders.forEach(reminder => {
    const reminderDiv = document.createElement('div');
    reminderDiv.className = 'flex justify-between items-center p-3 bg-white/10 rounded-xl';
    reminderDiv.innerHTML = `
      <div>
        <p class="font-semibold">${reminder.type === 'class' ? reminder.subject : reminder.name}</p>
        <p class="text-sm text-gray-400">
          ${reminder.type === 'class' ? `${reminder.day}, ${reminder.time} at ${reminder.location}` : `${reminder.date}, ${reminder.time}`}
        </p>
      </div>
      <button onclick="deleteReminder('${reminder.id}')" class="p-2 bg-red-500/80 rounded-xl hover:bg-red-500">
        <i class="fas fa-trash"></i>
      </button>
    `;
    remindersList.appendChild(reminderDiv);
  });
}

function deleteReminder(id) {
  reminders = reminders.filter(r => r.id !== id);
  localStorage.setItem('suhi-reminders', JSON.stringify(reminders));
  updateRemindersList();
  showNotification("Reminder deleted!");
}

function clearReminders() {
  reminders = [];
  localStorage.setItem('suhi-reminders', JSON.stringify(reminders));
  updateRemindersList();
  showNotification("All reminders cleared!");
  remindersModal.classList.add('hidden');
}

function showRemindersModal() {
  updateRemindersList();
  remindersModal.classList.remove('hidden');
}

function closeRemindersModal() {
  remindersModal.classList.add('hidden');
}

function closeReminderOption(button) {
  const reminderDiv = button.closest('div').parentElement;
  reminderDiv.style.display = 'none';
}

function addSymptom(symptom) {
  messageInput.value += (messageInput.value ? ', ' : '') + symptom;
  messageInput.focus();
}

function showNotification(message) {
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notification-text');
  notificationText.textContent = message;
  notification.classList.remove('translate-x-full');
  
  setTimeout(() => {
    notification.classList.add('translate-x-full');
  }, 5000);
}

function dismissNotification() {
  const notification = document.getElementById('notification');
  notification.classList.add('translate-x-full');
}

function checkUpcomingReminders() {
  const now = new Date();
  const currentTime = now.getTime();
  
  reminders.forEach(reminder => {
    const timeDiff = reminder.timestamp - currentTime;
    if (timeDiff > 0 && timeDiff <= 15 * 60 * 1000 && !reminder.notified) {
      showNotification(
        `Upcoming: ${reminder.type === 'class' ? reminder.subject : reminder.name} at ${reminder.time} ${reminder.type === 'class' ? `in ${reminder.location}` : `on ${reminder.date}`}`
      );
      reminder.notified = true;
      localStorage.setItem('suhi-reminders', JSON.stringify(reminders));
    }
  });

  reminders = reminders.filter(r => r.timestamp > currentTime);
  localStorage.setItem('suhi-reminders', JSON.stringify(reminders));
}

// Periodic reminder check
setInterval(checkUpcomingReminders, 30000);

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initializeApp);