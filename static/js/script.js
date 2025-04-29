document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const imageUpload = document.getElementById("image-upload");
  const imagePreview = document.getElementById("image-preview");
  const imagePreviewWrapper = document.getElementById("image-preview-wrapper");
  const uploadBtn = document.getElementById("upload-btn");
  const removeImageBtn = document.getElementById("remove-image-btn");
  const sendBtn = document.getElementById("send-btn");

  let base64Image = null;
  let isWaitingForResponse = false;

  // Image upload button click
  uploadBtn.addEventListener("click", () => {
    imageUpload.click();
  });

  // Remove image button click
  removeImageBtn.addEventListener("click", () => {
    resetImageUpload();
  });

  // Image upload change handler
  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      base64Image = event.target.result;
      imagePreview.src = base64Image;
      imagePreviewWrapper.style.display = "block";

      // Update placeholder to indicate image is attached
      userInput.placeholder =
        "Ask about this image or type a health question...";
    };
    reader.readAsDataURL(file);
  });

  // Reset image upload
  function resetImageUpload() {
    base64Image = null;
    imagePreview.src = "";
    imagePreviewWrapper.style.display = "none";
    imageUpload.value = "";
    userInput.placeholder = "Type your health question here...";
  }

  // Add a message to the chat
  function addMessage(content, isUser = false, imageUrl = null) {
    const message = document.createElement("div");
    message.className = `message ${isUser ? "user" : "bot"}`;

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    const avatarIcon = document.createElement("i");
    avatarIcon.className = isUser ? "fas fa-user" : "fas fa-robot";

    avatar.appendChild(avatarIcon);

    const textContent = document.createElement("div");
    textContent.className = "text-content";

    // Add image if provided
    if (imageUrl) {
      const userImage = document.createElement("img");
      userImage.src = imageUrl;
      userImage.style.maxWidth = "100%";
      userImage.style.maxHeight = "200px";
      userImage.style.marginBottom = "10px";
      userImage.style.borderRadius = "8px";
      textContent.appendChild(userImage);
    }

    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.textContent = content;

    textContent.appendChild(messageText);

    // Add the current time
    const messageTime = document.createElement("div");
    messageTime.className = "message-time";

    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    messageTime.textContent = timeString;

    textContent.appendChild(messageTime);

    if (isUser) {
      messageContent.appendChild(textContent);
      messageContent.appendChild(avatar);
    } else {
      messageContent.appendChild(avatar);
      messageContent.appendChild(textContent);
    }

    message.appendChild(messageContent);
    chatMessages.appendChild(message);

    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Show typing indicator
  function showTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "message bot";
    typing.id = "typing-indicator";

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    const avatarIcon = document.createElement("i");
    avatarIcon.className = "fas fa-robot";

    avatar.appendChild(avatarIcon);

    const textContent = document.createElement("div");
    textContent.className = "text-content";

    const typingIndicator = document.createElement("div");
    typingIndicator.className = "typing-indicator";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      typingIndicator.appendChild(dot);
    }

    textContent.appendChild(typingIndicator);
    messageContent.appendChild(avatar);
    messageContent.appendChild(textContent);
    typing.appendChild(messageContent);

    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Form submission handler (works for both text and image queries)
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if ((!message && !base64Image) || isWaitingForResponse) return;

    // Check if we have an image attached
    if (base64Image) {
      // We have an image, so use the image analysis endpoint
      handleImageSubmission(message);
    } else {
      // Text-only query
      handleTextSubmission(message);
    }
  });

  // Handle text-only submission
  async function handleTextSubmission(message) {
    // Add user message to chat
    addMessage(message, true);

    // Clear input
    userInput.value = "";

    // Show typing indicator
    showTypingIndicator();

    // Set waiting flag
    isWaitingForResponse = true;

    try {
      // Send request to server
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      // Remove typing indicator
      removeTypingIndicator();

      // Add bot response to chat
      addMessage(data.response);
    } catch (error) {
      console.error("Error:", error);

      // Remove typing indicator
      removeTypingIndicator();

      // Add error message
      addMessage("Sorry, something went wrong. Please try again.");
    } finally {
      // Reset waiting flag
      isWaitingForResponse = false;
    }
  }

  // Handle image submission
  async function handleImageSubmission(query) {
    // Add user message with image to chat
    addMessage(query || "Please analyze this image", true, base64Image);

    // Clear input
    userInput.value = "";

    // Show typing indicator
    showTypingIndicator();

    // Set waiting flag
    isWaitingForResponse = true;

    try {
      // Send request to server
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          query: query || "Please analyze this image",
        }),
      });

      const data = await response.json();

      // Remove typing indicator
      removeTypingIndicator();

      // Add bot response to chat
      addMessage(data.response);

      // Reset image upload
      resetImageUpload();
    } catch (error) {
      console.error("Error:", error);

      // Remove typing indicator
      removeTypingIndicator();

      // Add error message
      addMessage(
        "Sorry, something went wrong with the image analysis. Please try again."
      );
    } finally {
      // Reset waiting flag
      isWaitingForResponse = false;
    }
  }
});
