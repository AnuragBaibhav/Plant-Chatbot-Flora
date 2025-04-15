// Scheduler functionality for Cleaning Bot

// Array to store scheduled tasks
let scheduledTasks = JSON.parse(localStorage.getItem('scheduledTasks')) || [];

// Function to save tasks to localStorage
function saveScheduledTasks() {
  localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
}

// Function to add a new scheduled task
function addScheduledTask(task, date, time) {
  const newTask = {
    id: Date.now().toString(),
    task,
    date,
    time,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  scheduledTasks.push(newTask);
  saveScheduledTasks();
  return newTask;
}

// Function to mark a task as completed
function completeTask(taskId) {
  const taskIndex = scheduledTasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    scheduledTasks[taskIndex].completed = true;
    saveScheduledTasks();
    return true;
  }
  return false;
}

// Function to delete a task
function deleteTask(taskId) {
  scheduledTasks = scheduledTasks.filter(task => task.id !== taskId);
  saveScheduledTasks();
}

// Function to get all scheduled tasks
function getAllTasks() {
  return scheduledTasks;
}

// Function to get upcoming tasks (not completed)
function getUpcomingTasks() {
  return scheduledTasks.filter(task => !task.completed);
}

// Function to parse scheduling requests from chat
function parseSchedulingRequest(message) {
  // More specific regex to detect explicit scheduling intent
  const scheduleRegex = /^(?:please\s)?(?:schedule|remind me to|remind me about|set a reminder to|set a reminder for|add a task to|create a task for)/i;
  if (!scheduleRegex.test(message)) return null;
  
  // Try to extract date information
  const dateRegex = /(?:on|for|at)\s([a-z]+day|tomorrow|\d{1,2}(?:st|nd|rd|th)?\s(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s\d{4})?)/i;
  const timeRegex = /(?:at|by)\s(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
  
  const dateMatch = message.match(dateRegex);
  const timeMatch = message.match(timeRegex);
  
  // Extract the task description (everything before date/time indicators)
  let taskDescription = message;
  if (dateMatch) {
    const parts = message.split(dateMatch[0]);
    taskDescription = parts[0].trim();
  } else if (timeMatch) {
    const parts = message.split(timeMatch[0]);
    taskDescription = parts[0].trim();
  }
  
  // Remove common prefixes like "schedule" or "remind me to"
  taskDescription = taskDescription.replace(/^(?:please\s)?(?:schedule|remind me to|remind me about|set a reminder to|set a reminder for|add a task to|create a task for)\s/i, '');
  
  return {
    task: taskDescription,
    date: dateMatch ? dateMatch[1] : 'today',
    time: timeMatch ? timeMatch[1] : '9:00 am'
  };
}

// Function to show the scheduler modal
function showSchedulerModal() {
  const modal = document.getElementById('scheduler-modal');
  modal.style.display = 'flex';
  
  // Load and display tasks
  displayScheduledTasks();
}

// Function to close the scheduler modal
function closeSchedulerModal() {
  const modal = document.getElementById('scheduler-modal');
  modal.style.display = 'none';
}

// Function to display scheduled tasks in the modal
function displayScheduledTasks() {
  const tasksList = document.getElementById('scheduled-tasks-list');
  tasksList.innerHTML = '';
  
  const tasks = getAllTasks();
  
  if (tasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-tasks">No scheduled tasks yet.</div>';
    return;
  }
  
  // Group tasks by date
  const groupedTasks = {};
  
  tasks.forEach(task => {
    if (!groupedTasks[task.date]) {
      groupedTasks[task.date] = [];
    }
    groupedTasks[task.date].push(task);
  });
  
  // Create sections for each date
  for (const date in groupedTasks) {
    const dateSection = document.createElement('div');
    dateSection.className = 'task-date-section';
    dateSection.innerHTML = `<h3>${date}</h3>`;
    
    const tasksForDate = groupedTasks[date];
    tasksForDate.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskItem.setAttribute('data-task-id', task.id);
      
      taskItem.innerHTML = `
        <div class="task-content">
          <div class="task-checkbox">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskCompletion('${task.id}')">
          </div>
          <div class="task-details">
            <div class="task-text">${task.task}</div>
            <div class="task-time">${task.time}</div>
          </div>
        </div>
        <button class="delete-task-btn" onclick="deleteTask('${task.id}'); displayScheduledTasks();"><i class="fas fa-trash"></i></button>
      `;
      
      dateSection.appendChild(taskItem);
    });
    
    tasksList.appendChild(dateSection);
  }
}

// Function to toggle task completion status
function toggleTaskCompletion(taskId) {
  const taskIndex = scheduledTasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    scheduledTasks[taskIndex].completed = !scheduledTasks[taskIndex].completed;
    saveScheduledTasks();
    displayScheduledTasks();
  }
}

// Function to add a new task from the form
function addTaskFromForm() {
  const taskInput = document.getElementById('new-task-input');
  const dateInput = document.getElementById('new-task-date');
  const timeInput = document.getElementById('new-task-time');
  
  const task = taskInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  
  if (!task || !date) {
    alert('Please enter both a task and a date');
    return;
  }
  
  // Format the date for display
  const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  // Format the time for display
  let formattedTime = time;
  if (time) {
    const timeParts = time.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    formattedTime = `${displayHours}:${minutes} ${period}`;
  }
  
  addScheduledTask(task, formattedDate, formattedTime);
  
  // Clear the form
  taskInput.value = '';
  dateInput.value = '';
  timeInput.value = '';
  
  // Refresh the tasks list
  displayScheduledTasks();
}

// Initialize date input with today's date
function initSchedulerForm() {
  const dateInput = document.getElementById('new-task-date');
  if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    dateInput.min = dateInput.value; // Prevent selecting past dates
  }
}

// Function to handle chat messages that might contain scheduling requests
function handleSchedulingInChat(message) {
  const schedulingInfo = parseSchedulingRequest(message);
  
  // Check if this is a request about plant care tasks without scheduling
  const taskInfoRegex = /(?:what are my|show me my|list my|tell me about my|do i have any)\s(?:tasks|reminders|scheduled tasks|plant care tasks)/i;
  const isTaskInfoRequest = taskInfoRegex.test(message);
  
  if (schedulingInfo) {
    const { task, date, time } = schedulingInfo;
    const newTask = addScheduledTask(task, date, time);
    
    // Return a confirmation message with API-like response
    return {
      type: 'scheduling',
      action: 'created',
      task: newTask,
      message: `I've scheduled "${task}" for ${date} at ${time}. You can view all your plant care tasks by clicking the Scheduler button.`
    };
  } else if (isTaskInfoRequest) {
    // Return information about tasks without scheduling anything
    const upcomingTasks = getUpcomingTasks();
    let responseMessage = '';
    
    if (upcomingTasks.length === 0) {
      responseMessage = "You don't have any scheduled plant care tasks. Would you like me to help you create one?";
    } else {
      responseMessage = `You have ${upcomingTasks.length} scheduled plant care tasks. Here are your upcoming tasks:\n`;
      upcomingTasks.forEach(task => {
        responseMessage += `- ${task.task} on ${task.date} at ${task.time}\n`;
      });
      responseMessage += "\nYou can view and manage all your tasks by clicking the Scheduler button.";
    }
    
    return {
      type: 'info',
      action: 'list',
      tasks: upcomingTasks,
      message: responseMessage
    };
  }
  
  return null; // No scheduling or task info request detected
}

// Export functions for use in main script
window.showSchedulerModal = showSchedulerModal;
window.closeSchedulerModal = closeSchedulerModal;
window.addTaskFromForm = addTaskFromForm;
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTask = deleteTask;
window.handleSchedulingInChat = handleSchedulingInChat;

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the scheduler form if it exists
  if (document.getElementById('new-task-date')) {
    initSchedulerForm();
  }
});