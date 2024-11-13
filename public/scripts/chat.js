const socket = io();

const messageContainer = document.getElementById('message-container')
const nameInput = document.getElementById('name-input')
const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')
const userChatDiv = document.getElementById('userchat');

// Access the data attributes
const user_Id = userChatDiv.dataset.useramount;
const course_Id = userChatDiv.dataset.courseamount;
const roleis= userChatDiv.dataset.roleamount;

messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  sendMessage()
})

function sendMessage(){
    if (messageInput.value === '') return
    // console.log(messageInput.value)
    const data = {
        name: nameInput.value,
        message: messageInput.value,
        dateTime: new Date(),
        userid:user_Id,
        courseid:course_Id,
        role:roleis,
      };
      socket.emit('message', data)
      addMessageToUI(true, data)
    messageInput.value = ''
}

socket.on('chat-message', (data) => {
    // console.log(data)
    addMessageToUI(false, data)
  })

  function addMessageToUI(isOwnMessage, data) {
    
    const element = `
        <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
            <p class="message">
              ${data.message}
              <span>${data.name} ● ${moment(data.dateTime).fromNow()}</span>
            </p>
          </li>
          `
  
    messageContainer.innerHTML += element
    scrollToBottom()
  }  

  function scrollToBottom() {
    messageContainer.scrollTo(0, messageContainer.scrollHeight)
  }
