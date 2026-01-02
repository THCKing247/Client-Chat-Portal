// Chatbot helper functions - make available immediately
// These will be redefined in the chatbot block below, but this ensures they're available early
window.testChatbotAI = window.testChatbotAI || function() {
  console.warn('⚠️ Chatbot functions not loaded yet. Please refresh the page (Ctrl+F5 for hard refresh).');
  return Promise.resolve(false);
};
window.checkChatbotAI = window.checkChatbotAI || function() {
  console.warn('⚠️ Chatbot functions not loaded yet. Please refresh the page (Ctrl+F5 for hard refresh).');
  return { enabled: false, error: 'Functions not loaded' };
};

// Set active nav link
const currentPath = window.location.pathname;
const navLinks = document.querySelectorAll(".nav a");
navLinks.forEach(link=>{
  const linkPath = new URL(link.href).pathname;
  if(linkPath === currentPath || (currentPath === "/" && linkPath === "/") || (currentPath.endsWith("/") && linkPath === currentPath.slice(0, -1))){
    link.classList.add("active");
  }
});

// FAQ Accordion
document.querySelectorAll(".faq-item").forEach(item=>{
  const question = item.querySelector(".faq-question");
  if(question){
    question.addEventListener("click",()=>{
      const isActive = item.classList.contains("active");
      document.querySelectorAll(".faq-item").forEach(i=>i.classList.remove("active"));
      if(!isActive) item.classList.add("active");
    });
  }
});

// Handle blog images - show fallback text when images fail to load
document.querySelectorAll(".blog-card-image img, .blog-post-image img").forEach(img=>{
  img.addEventListener("error", function(){
    this.style.display = "none";
    this.classList.add("error");
    const container = this.parentElement;
    if(container){
      container.classList.add("image-missing");
    }
  });
  
  // Check if image loaded successfully
  if(img.complete && img.naturalHeight === 0){
    img.dispatchEvent(new Event("error"));
  }
});

// Scroll reveal
const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting) e.target.classList.add("in");
  });
},{threshold:.15});
reveals.forEach(r=>io.observe(r));

// Header shrink - disabled to prevent glitching
// const header = document.querySelector(".site-header");
// if(header){
//   window.addEventListener("scroll",()=>{
//     if(window.scrollY > 30) header.classList.add("is-shrunk");
//     else header.classList.remove("is-shrunk");
//   },{passive:true});
// }

// Mobile menu
const nav = document.querySelector(".nav");
const mobileToggle = document.querySelector(".mobile-menu-toggle");
if(nav && mobileToggle){
  mobileToggle.addEventListener("click",()=>{
    nav.classList.toggle("is-open");
    const isOpen = nav.classList.contains("is-open");
    mobileToggle.setAttribute("aria-expanded", isOpen);
    mobileToggle.innerHTML = isOpen ? "✕" : "☰";
  });
  
  // Close menu when clicking outside
  document.addEventListener("click",(e)=>{
    if(!nav.contains(e.target) && !mobileToggle.contains(e.target)){
      nav.classList.remove("is-open");
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileToggle.innerHTML = "☰";
    }
  });
  
  // Close menu on escape key
  document.addEventListener("keydown",(e)=>{
    if(e.key === "Escape" && nav.classList.contains("is-open")){
      nav.classList.remove("is-open");
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileToggle.innerHTML = "☰";
      mobileToggle.focus();
    }
  });
  
  // Close menu when clicking nav links on mobile
  nav.querySelectorAll("a").forEach(link=>{
    link.addEventListener("click",()=>{
      if(window.innerWidth <= 768){
        nav.classList.remove("is-open");
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileToggle.innerHTML = "☰";
      }
    });
  });
}

// Particles
const canvas = document.getElementById("particles");
if(canvas){
  const ctx = canvas.getContext("2d");
  let w,h;
  function resize(){
    w=canvas.width=window.innerWidth;
    h=canvas.height=window.innerHeight;
  }
  resize();
  window.addEventListener("resize",resize);

  const dots=[...Array(70)].map(()=>({
    x:Math.random()*w,
    y:Math.random()*h,
    r:Math.random()*2+1,
    vx:(Math.random()-.5)*.4,
    vy:(Math.random()-.5)*.4
  }));

  function draw(){
    ctx.clearRect(0,0,w,h);
    dots.forEach(d=>{
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>w) d.vx*=-1;
      if(d.y<0||d.y>h) d.vy*=-1;
      ctx.beginPath();
      ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle="rgba(255,255,255,.35)";
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// Contact form validation and submission
const contactForm = document.getElementById("contactForm");
if(contactForm){
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn?.querySelector(".btn-text");
  const btnLoader = submitBtn?.querySelector(".btn-loader");
  const formStatus = document.getElementById("form-status");
  const captchaCheckbox = document.getElementById("captcha");
  const charCount = document.getElementById("charCount");
  const messageField = document.getElementById("message");
  
  // Rate limiting - prevent double submissions
  let lastSubmissionTime = 0;
  const MIN_SUBMISSION_INTERVAL = 5000; // 5 seconds
  
  // Character counter
  if(messageField && charCount){
    messageField.addEventListener("input", ()=>{
      const length = messageField.value.length;
      charCount.textContent = length;
      if(length > 2000){
        messageField.value = messageField.value.substring(0, 2000);
        charCount.textContent = "2000";
      }
      charCount.style.color = length > 1800 ? "#ef4444" : "var(--muted)";
    });
  }
  
  function showError(fieldId, message){
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if(field && errorEl){
      field.setAttribute("aria-invalid", "true");
      field.classList.add("error");
      errorEl.textContent = message;
    }
  }
  
  function clearError(fieldId){
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if(field && errorEl){
      field.removeAttribute("aria-invalid");
      field.classList.remove("error");
      errorEl.textContent = "";
    }
  }
  
  function clearAllErrors(){
    ["name","email","phone","jobTitle","companyName","companyWebsite","topic","message","captcha"].forEach(clearError);
    if(formStatus) formStatus.textContent = "";
    if(formStatus) formStatus.className = "form-status";
  }
  
  // Clear captcha error when checked
  if(captchaCheckbox){
    captchaCheckbox.addEventListener("change", ()=>{
      if(captchaCheckbox.checked){
        clearError("captcha");
      }
    });
  }
  
  function setLoading(loading){
    if(!submitBtn) return;
    submitBtn.disabled = loading;
    if(btnText) btnText.style.display = loading ? "none" : "inline";
    if(btnLoader) btnLoader.style.display = loading ? "inline" : "none";
  }
  
  function showStatus(message, isError = false){
    if(!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status ${isError ? "error" : "success"}`;
    formStatus.setAttribute("role", "alert");
  }
  
  // Real-time validation
  ["name","email","phone","jobTitle","companyName","companyWebsite","topic","message","captcha"].forEach(id=>{
    const field = document.getElementById(id);
    if(field){
      field.addEventListener("blur", ()=>{
        if(field.value.trim() && field.id !== "captcha"){
          clearError(id);
        }
      });
      field.addEventListener("input", ()=>{
        if(field.id === "phone"){
          // Basic phone validation
          const phoneValue = field.value.replace(/\D/g, '');
          if(phoneValue.length > 0 && phoneValue.length < 10){
            // Invalid but don't show error until blur
          } else {
            clearError(id);
          }
        } else if(field.id === "companyWebsite" && field.value){
          // Basic URL validation
          try {
            new URL(field.value.startsWith('http') ? field.value : `https://${field.value}`);
            clearError(id);
          } catch {
            // Invalid URL, but don't show error until blur
          }
        } else if(field.validity.valid && field.id !== "captcha"){
          clearError(id);
        }
      });
    }
  });
  
  contactForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    clearAllErrors();
    
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastSubmission = now - lastSubmissionTime;
    if(timeSinceLastSubmission < MIN_SUBMISSION_INTERVAL){
      const remainingTime = Math.ceil((MIN_SUBMISSION_INTERVAL - timeSinceLastSubmission) / 1000);
      showStatus(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before submitting again.`, true);
      return;
    }
    
    const formData = new FormData(contactForm);
    let isValid = true;
    
    // Validate name
    const name = formData.get("name")?.trim();
    if(!name){
      showError("name", "Please enter your name");
      isValid = false;
    }
    
    // Validate email
    const email = formData.get("email")?.trim();
    const emailField = document.getElementById("email");
    if(!email){
      showError("email", "Please enter your email address");
      isValid = false;
    } else if(emailField && !emailField.validity.valid){
      showError("email", "Please enter a valid email address");
      isValid = false;
    }
    
    // Validate phone (optional but if provided, should be valid)
    const phone = formData.get("phone")?.trim();
    if(phone){
      const phoneDigits = phone.replace(/\D/g, '');
      if(phoneDigits.length > 0 && phoneDigits.length < 10){
        showError("phone", "Please enter a valid phone number");
        isValid = false;
      }
    }
    
    // Validate company website (optional but if provided, should be valid)
    const companyWebsite = formData.get("companyWebsite")?.trim();
    if(companyWebsite){
      try {
        const url = companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`;
        new URL(url);
      } catch {
        showError("companyWebsite", "Please enter a valid website URL");
        isValid = false;
      }
    }
    
    // Validate topic
    const topic = formData.get("topic");
    if(!topic){
      showError("topic", "Please select a topic");
      isValid = false;
    }
    
    // Validate message
    const message = formData.get("message")?.trim();
    if(!message){
      showError("message", "Please enter a message");
      isValid = false;
    } else if(message.length < 10){
      showError("message", "Please provide more details (at least 10 characters)");
      isValid = false;
    } else if(message.length > 2000){
      showError("message", "Message must be 2000 characters or less");
      isValid = false;
    }
    
    // Validate CAPTCHA checkbox
    if(!captchaCheckbox || !captchaCheckbox.checked){
      showError("captcha", "Please confirm you are not a robot by checking the box");
      isValid = false;
    }
    
    if(!isValid){
      const firstError = contactForm.querySelector(".error, [aria-invalid='true']");
      if(firstError){
        firstError.focus();
        firstError.scrollIntoView({behavior: "smooth", block: "center"});
      }
      return;
    }
    
    // Update last submission time
    lastSubmissionTime = now;
    
    setLoading(true);
    showStatus("Sending your message...", false);
    
    try{
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });
      
      if(response.ok){
        showStatus("Message sent successfully! Redirecting...", false);
        // Store submission time in sessionStorage
        sessionStorage.setItem("lastFormSubmission", now.toString());
        setTimeout(()=>{
          window.location.href = "/contact/thanks/";
        }, 1000);
      } else {
        const data = await response.json();
        if(data.errors){
          const firstError = data.errors[0];
          showStatus(firstError.message || "There was an error sending your message. Please try again.", true);
        } else {
          showStatus("There was an error sending your message. Please try again or email us directly.", true);
        }
        setLoading(false);
        // Reset CAPTCHA checkbox
        if(captchaCheckbox) captchaCheckbox.checked = false;
      }
    } catch(error){
      showStatus("Network error. Please check your connection and try again, or email us directly.", true);
      setLoading(false);
      // Reset CAPTCHA checkbox
      if(captchaCheckbox) captchaCheckbox.checked = false;
    }
  });
  
  // Check sessionStorage on load for additional rate limiting
  const storedTime = sessionStorage.getItem("lastFormSubmission");
  if(storedTime){
    const stored = parseInt(storedTime);
    const timeSince = Date.now() - stored;
    if(timeSince < MIN_SUBMISSION_INTERVAL){
      const remaining = Math.ceil((MIN_SUBMISSION_INTERVAL - timeSince) / 1000);
      if(submitBtn && btnText){
        submitBtn.disabled = true;
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="btn-text">Please wait ${remaining}s</span>`;
        setTimeout(()=>{
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }, MIN_SUBMISSION_INTERVAL - timeSince);
      }
    }
  }
}

// Back to Top Button
const backToTopBtn = document.createElement("button");
backToTopBtn.className = "back-to-top";
backToTopBtn.innerHTML = "↑";
backToTopBtn.setAttribute("aria-label", "Back to top");
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.body.appendChild(backToTopBtn);

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add("visible");
  } else {
    backToTopBtn.classList.remove("visible");
  }
}, { passive: true });

// Search Functionality
const searchBox = document.querySelector(".search-box");
if (searchBox) {
  const searchResults = document.querySelector(".search-results");
  const pages = [
    { title: "Home", url: "/", content: "Web development, automation, custom apps" },
    { title: "Services", url: "/services/", content: "Custom web applications, automation, websites, consulting" },
    { title: "About", url: "/about/", content: "About Apex Technical Solutions Group" },
    { title: "Contact", url: "/contact/", content: "Get in touch, request a quote" },
    { title: "FAQ", url: "/faq/", content: "Frequently asked questions" },
    { title: "Pricing", url: "/pricing/", content: "Project pricing and rates" },
    { title: "Process", url: "/process/", content: "How we work, development process" },
    { title: "Blog", url: "/blog/", content: "Technology trends, web development, automation" },
    { title: "Technology Trends", url: "/blog/technology-trends/", content: "Latest technology trends in web development" },
    { title: "Business Automation", url: "/blog/business-automation/", content: "Business automation strategies and implementation" },
    { title: "Customer Experience Automation", url: "/blog/customer-experience-automation/", content: "Automating customer experience touchpoints" },
    { title: "Modern Web Development", url: "/blog/modern-web-development/", content: "Modern web development practices and architecture" },
    { title: "Web Performance", url: "/blog/web-performance/", content: "Web performance optimization strategies" },
    { title: "Documentation Best Practices", url: "/blog/documentation-best-practices/", content: "Technical documentation best practices" }
  ];

  searchBox.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!searchResults) return;

    if (query.length < 2) {
      searchResults.innerHTML = "";
      return;
    }

    const results = pages.filter(page => 
      page.title.toLowerCase().includes(query) || 
      page.content.toLowerCase().includes(query)
    );

    if (results.length === 0) {
      searchResults.innerHTML = `<div class="search-result-item"><p>No results found for "${query}"</p></div>`;
      return;
    }

    searchResults.innerHTML = results.map(page => {
      const highlightedTitle = page.title.replace(
        new RegExp(`(${query})`, "gi"),
        '<span class="search-highlight">$1</span>'
      );
      return `
        <div class="search-result-item">
          <h3><a href="${page.url}">${highlightedTitle}</a></h3>
          <p>${page.content}</p>
        </div>
      `;
    }).join("");
  });
}

// Newsletter Form
const newsletterForm = document.querySelector(".newsletter-form");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector("input[type='email']");
    const email = emailInput.value;
    const submitBtn = newsletterForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.textContent : "";
    
    // Disable button and show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Subscribing...";
    }
    
    try {
      const response = await fetch("https://formspree.io/f/mgowqqrj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: email,
          _subject: "Newsletter Subscription",
          _replyto: email
        })
      });
      
      if (response.ok) {
        alert("Thank you for subscribing! We'll be in touch soon.");
        newsletterForm.reset();
      } else {
        const data = await response.json();
        if (data.errors) {
          alert("Please enter a valid email address.");
        } else {
          alert("Something went wrong. Please try again later.");
        }
      }
    } catch (error) {
      alert("Something went wrong. Please try again later.");
    } finally {
      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}

// Cookie Consent
function showCookieConsent() {
  const consent = localStorage.getItem("cookieConsent");
  if (!consent) {
    const cookieBanner = document.querySelector(".cookie-consent");
    if (cookieBanner) {
      setTimeout(() => cookieBanner.classList.add("show"), 1000);
    }
  }
}

function acceptCookies() {
  localStorage.setItem("cookieConsent", "accepted");
  const cookieBanner = document.querySelector(".cookie-consent");
  if (cookieBanner) {
    cookieBanner.classList.remove("show");
  }
}

function declineCookies() {
  localStorage.setItem("cookieConsent", "declined");
  const cookieBanner = document.querySelector(".cookie-consent");
  if (cookieBanner) {
    cookieBanner.classList.remove("show");
  }
}

// Initialize cookie consent
document.addEventListener("DOMContentLoaded", () => {
  showCookieConsent();
  
  const acceptBtn = document.querySelector(".cookie-consent-btn.accept");
  const declineBtn = document.querySelector(".cookie-consent-btn.decline");
  if (acceptBtn) acceptBtn.addEventListener("click", acceptCookies);
  if (declineBtn) declineBtn.addEventListener("click", declineCookies);
});

// Calculate Reading Time
function calculateReadingTime() {
  const blogContent = document.querySelector(".blog-post-content");
  if (!blogContent) return;

  const text = blogContent.innerText || blogContent.textContent;
  const words = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words/min

  const readingTimeEl = document.querySelector(".reading-time");
  if (readingTimeEl) {
    readingTimeEl.innerHTML = `<span>⏱️</span> ${readingTime} min read`;
  }
}

// Generate Table of Contents
function generateTableOfContents() {
  const blogContent = document.querySelector(".blog-post-content");
  if (!blogContent) return;

  const headings = blogContent.querySelectorAll("h2");
  if (headings.length < 2) return; // Only show if 2+ headings

  const toc = document.createElement("div");
  toc.className = "table-of-contents";
  toc.innerHTML = `
    <h3>Table of Contents</h3>
    <ul>
      ${Array.from(headings).map((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        return `<li><a href="#${id}">${heading.textContent}</a></li>`;
      }).join("")}
    </ul>
  `;

  blogContent.insertBefore(toc, blogContent.firstChild);
}

// Initialize blog enhancements
document.addEventListener("DOMContentLoaded", () => {
  calculateReadingTime();
  generateTableOfContents();
});

// Chatbot functionality (site-wide)
{
  const chatbotWidget = document.getElementById("chatbotWidget");
  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbotClose = document.getElementById("chatbotClose");
  const chatbotMessages = document.getElementById("chatbotMessages");
  const chatbotInput = document.getElementById("chatbotInput");
  const chatbotSend = document.getElementById("chatbotSend");
  const quickReplyBtns = document.querySelectorAll(".quick-reply-btn");

  // Make sure functions are available immediately
  // These will be defined below, but we'll also log when they're ready
  console.log('🤖 Chatbot initialized. Use testChatbotAI() or checkChatbotAI() in console.');

  // Storage key for chat history
  const CHAT_STORAGE_KEY = "apex_chatbot_history";
  const CHAT_EXPIRY_HOURS = 24; // Chat history expires after 24 hours

  // AI Configuration for Ollama
  // Ollama runs locally - make sure it's installed and running
  // Install: https://ollama.ai
  // Run: ollama serve (usually runs on http://localhost:11434)
  const AI_CONFIG = {
    enabled: true, // Set to false to use keyword matching only
    baseUrl: "http://localhost:11434", // Ollama API base URL
    model: "llama2", // Popular models: llama2, mistral, codellama, phi, gemma
    temperature: 0.7,
    stream: false // Set to true for streaming responses (requires different handling)
  };

  // Get Ollama base URL (can be customized)
  function getOllamaUrl() {
    const customUrl = localStorage.getItem('apex_ollama_url');
    return customUrl || AI_CONFIG.baseUrl;
  }

  // Helper function to set Ollama URL (can be called from browser console)
  // Usage: window.setChatbotOllamaUrl('http://localhost:11434')
  window.setChatbotOllamaUrl = function(url) {
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL. Please provide a valid Ollama API URL.');
      return false;
    }
    // Remove trailing slash
    url = url.replace(/\/$/, '');
    localStorage.setItem('apex_ollama_url', url);
    console.log('✅ Ollama URL set successfully!', url);
    return true;
  };

  // Helper function to set Ollama model
  // Usage: window.setChatbotModel('mistral')
  window.setChatbotModel = function(model) {
    if (!model || typeof model !== 'string') {
      console.error('Invalid model name. Please provide a valid Ollama model name.');
      return false;
    }
    AI_CONFIG.model = model;
    localStorage.setItem('apex_ollama_model', model);
    console.log('✅ Model set successfully!', model);
    return true;
  };

  // Helper function to check if AI is configured
  window.checkChatbotAI = function() {
    const isEnabled = AI_CONFIG.enabled;
    const baseUrl = getOllamaUrl();
    const model = localStorage.getItem('apex_ollama_model') || AI_CONFIG.model;
    
    console.log('Chatbot AI Status:', {
      enabled: isEnabled,
      provider: 'Ollama',
      baseUrl: baseUrl,
      model: model,
      status: isEnabled ? '✅ Active (make sure Ollama is running)' : '⚠️ Disabled (using keyword matching)'
    });
    return { enabled: isEnabled, provider: 'Ollama', baseUrl, model };
  };

  // Test function to verify Ollama connection
  window.testChatbotAI = async function() {
    console.log('🧪 Testing Ollama connection...');
    const baseUrl = getOllamaUrl();
    const model = localStorage.getItem('apex_ollama_model') || AI_CONFIG.model;
    
    try {
      // Test if Ollama is reachable
      const testResponse = await fetch(`${baseUrl}/api/tags`, {
        method: "GET"
      });
      
      if (!testResponse.ok) {
        console.error('❌ Ollama connection failed:', testResponse.status, testResponse.statusText);
        console.log('💡 Make sure Ollama is running: ollama serve');
        return false;
      }
      
      const models = await testResponse.json();
      const modelExists = models.models?.some(m => m.name.includes(model.split(':')[0]));
      
      if (!modelExists) {
        console.warn('⚠️ Model not found:', model);
        console.log('💡 Pull the model first: ollama pull', model.split(':')[0]);
        console.log('Available models:', models.models?.map(m => m.name).join(', ') || 'none');
      } else {
        console.log('✅ Model found:', model);
      }
      
      // Test actual chat request
      console.log('🧪 Testing chat API...');
      const chatResponse = await getAIResponse('Hello, this is a test message.');
      
      if (chatResponse) {
        console.log('✅ Ollama is working! Response:', chatResponse.substring(0, 100) + '...');
        return true;
      } else {
        console.warn('⚠️ Ollama responded but returned no content');
        return false;
      }
    } catch (error) {
      console.error('❌ Ollama test failed:', error.message);
      console.log('💡 Troubleshooting:');
      console.log('   1. Make sure Ollama is installed: https://ollama.ai');
      console.log('   2. Start Ollama: ollama serve');
      console.log('   3. Pull a model: ollama pull', model.split(':')[0]);
      console.log('   4. Check if Ollama is running on:', baseUrl);
      return false;
    }
  };

  // Knowledge base for chatbot responses (used as context for AI and fallback)
  const knowledgeBase = {
    "services": {
      keywords: ["service", "what do you", "what can you", "offer", "build", "create"],
      response: "We offer several services:\n\n🌐 **Websites & Landing Pages** - Fast, modern sites with clean messaging\n⚡ **Custom Web Applications** - Portals, dashboards, internal tools with secure logins\n🔁 **Automation & Integrations** - Connect tools and automate repetitive processes\n🛡️ **Technical Consulting** - Clear scoping, architecture guidance, and roadmap planning\n\nWould you like more details about any specific service?"
    },
    "pricing": {
      keywords: ["price", "cost", "how much", "pricing", "rate", "budget", "expensive"],
      response: "Pricing varies based on project scope, complexity, and timeline. We provide custom quotes after understanding your specific requirements.\n\nMost projects range from a few thousand to tens of thousands depending on the work involved.\n\n**Simple websites**: Typically $2,000 - $5,000\n**Custom web apps**: $5,000 - $25,000+\n**Automation projects**: $1,500 - $10,000+\n\nContact us for a detailed estimate tailored to your needs!"
    },
    "timeline": {
      keywords: ["how long", "timeline", "duration", "when", "time", "deadline", "schedule"],
      response: "Timeline depends on project complexity:\n\n**Simple websites**: 2-4 weeks\n**Custom applications**: 6-12 weeks or more\n**Automation projects**: 2-8 weeks\n\nWe work in milestones with regular updates, so you'll always know where things stand. We can discuss your timeline during the discovery phase.\n\nDo you have a specific deadline in mind?"
    },
    "technologies": {
      keywords: ["technology", "tech stack", "what do you use", "framework", "language", "tools"],
      response: "We use modern, industry-standard technologies:\n\n**Frontend**: React, Vue, HTML5, CSS3, JavaScript/TypeScript\n**Backend**: Node.js, Python, various APIs\n**Cloud**: AWS, Azure, and other cloud platforms\n\nWe choose the best stack for each project based on requirements, scalability needs, and your team's preferences.\n\nIs there a specific technology you're interested in?"
    },
    "process": {
      keywords: ["process", "how do you work", "workflow", "steps", "methodology"],
      response: "We follow a structured 4-step process:\n\n**1. Discovery** - Clarify goals, users, requirements, and constraints\n**2. Build** - Deliver in milestones with quick feedback loops\n**3. Launch** - Go live with performance, security, and usability checks\n**4. Support** - Updates, enhancements, and continuous improvement\n\nYou'll have regular check-ins and opportunities to provide feedback throughout. Want to know more about any step?"
    },
    "contact": {
      keywords: ["contact", "email", "phone", "reach", "get in touch"],
      response: "You can reach us at:\n\n📧 **Email**: info@apextsgroup.com\n\nOr simply fill out the contact form on this page! We typically respond within 24 hours.\n\nIs there something specific you'd like to discuss?"
    },
    "default": {
      response: "I'm here to help! I can answer questions about:\n\n• Our services\n• Pricing and estimates\n• Project timelines\n• Technologies we use\n• Our development process\n\nWhat would you like to know?"
    }
  };

  // Function to find the best response (keyword matching fallback)
  function findResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, data] of Object.entries(knowledgeBase)) {
      if (key === "default") continue;
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return data.response;
      }
    }
    
    return knowledgeBase.default.response;
  }

  // Build system prompt from knowledge base
  function buildSystemPrompt() {
    let prompt = "You are a helpful customer service chatbot for Apex Technical Solutions Group, a web development and automation company.\n\n";
    prompt += "Company Information:\n";
    prompt += "- Services: Websites & Landing Pages, Custom Web Applications, Automation & Integrations, Technical Consulting\n";
    prompt += "- Contact: info@apextsgroup.com\n";
    prompt += "- Process: Discovery → Build → Launch → Support\n\n";
    prompt += "Pricing Guidelines:\n";
    prompt += "- Simple websites: $2,000 - $5,000\n";
    prompt += "- Custom web apps: $5,000 - $25,000+\n";
    prompt += "- Automation projects: $1,500 - $10,000+\n\n";
    prompt += "Timeline Guidelines:\n";
    prompt += "- Simple websites: 2-4 weeks\n";
    prompt += "- Custom applications: 6-12 weeks or more\n";
    prompt += "- Automation projects: 2-8 weeks\n\n";
    prompt += "Technologies: React, Vue, HTML5, CSS3, JavaScript/TypeScript, Node.js, Python, AWS, Azure\n\n";
    prompt += "Be friendly, professional, and helpful. Keep responses concise and informative. If asked about something not in your knowledge, politely direct them to contact info@apextsgroup.com for more details.";
    return prompt;
  }

  // Get conversation history for AI context
  function getConversationHistory() {
    if (!chatbotMessages) return [];
    const messages = [];
    chatbotMessages.querySelectorAll(".chatbot-message").forEach(msg => {
      const isUser = msg.classList.contains("user-message");
      const text = msg.querySelector(".message-content p").textContent.trim();
      if (text) {
        messages.push({
          role: isUser ? "user" : "assistant",
          content: text
        });
      }
    });
    return messages;
  }

  // Call Ollama API
  async function getAIResponse(userMessage) {
    if (!AI_CONFIG.enabled) {
      return null; // Fall back to keyword matching
    }

    try {
      const conversationHistory = getConversationHistory();
      const baseUrl = getOllamaUrl();
      const model = localStorage.getItem('apex_ollama_model') || AI_CONFIG.model;
      
      // Build messages array for Ollama API
      // Ollama uses a similar format to OpenAI but includes system message in messages array
      const messages = [
        { role: "system", content: buildSystemPrompt() },
        ...conversationHistory.slice(-10), // Last 10 messages for context
        { role: "user", content: userMessage }
      ];

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: AI_CONFIG.stream,
          options: {
            temperature: AI_CONFIG.temperature
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        console.error("Ollama API error:", error);
        
        // Check for CORS/403 errors
        if (response.status === 403 || response.status === 0) {
          console.error("❌ CORS Error (403): Ollama is blocking requests from this domain.");
          console.log("💡 Fix: Set OLLAMA_ORIGINS environment variable:");
          console.log(`   $env:OLLAMA_ORIGINS="${window.location.origin}"`);
          console.log("   Then restart Ollama: ollama serve");
        } else if (response.status === 500) {
          console.warn("⚠️ Ollama may not be running. Make sure Ollama is installed and running on", baseUrl);
        }
        
        return null; // Fall back to keyword matching
      }

      const data = await response.json();
      
      // Ollama response format: { message: { content: "...", role: "assistant" }, ... }
      const aiResponse = data.message?.content?.trim() || null;
      
      if (aiResponse) {
        console.log("✅ Ollama AI Response received successfully!");
        console.log("Model:", model, "| URL:", baseUrl);
      }
      
      return aiResponse;
    } catch (error) {
      console.error("Error calling Ollama API:", error);
      
      // Network errors usually mean Ollama isn't running or CORS is blocking
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const isCorsError = error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin');
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = getOllamaUrl().includes('localhost') || getOllamaUrl().includes('127.0.0.1');
        
        if (isHttps && isLocalhost && getOllamaUrl().startsWith('http://')) {
          console.error("❌ Mixed Content Error: Cannot access HTTP localhost from HTTPS website.");
          console.log("💡 Solutions:");
          console.log("   1. Use a backend proxy (recommended for production)");
          console.log("   2. For local testing, access site via http://localhost instead of https://");
          console.log("   3. Set up Ollama behind HTTPS reverse proxy");
        } else if (isCorsError || (isHttps && !isLocalhost)) {
          console.error("❌ CORS Error: Ollama is blocking cross-origin requests.");
          console.log("💡 Solution: Set OLLAMA_ORIGINS environment variable before starting Ollama:");
          console.log(`   Windows: $env:OLLAMA_ORIGINS='${window.location.origin}'`);
          console.log(`   Linux/Mac: export OLLAMA_ORIGINS='${window.location.origin}'`);
          console.log("   Then restart: ollama serve");
        } else {
          console.warn("⚠️ Cannot connect to Ollama. Make sure Ollama is running on", getOllamaUrl());
        }
      }
      
      return null; // Fall back to keyword matching
    }
  }

  // Save chat history to localStorage
  function saveChatHistory() {
    if (!chatbotMessages) return;
    const messages = [];
    chatbotMessages.querySelectorAll(".chatbot-message").forEach(msg => {
      const isUser = msg.classList.contains("user-message");
      const text = msg.querySelector(".message-content p").innerHTML.replace(/<br>/g, "\n");
      messages.push({ text, isUser });
    });
    const chatData = {
      messages: messages,
      timestamp: Date.now()
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatData));
  }

  // Load chat history from localStorage
  function loadChatHistory() {
    if (!chatbotMessages) return false;
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!saved) return false;

      const chatData = JSON.parse(saved);
      const now = Date.now();
      const expiryTime = CHAT_EXPIRY_HOURS * 60 * 60 * 1000;

      // Check if chat history has expired
      if (now - chatData.timestamp > expiryTime) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        return false;
      }

      // Clear the initial welcome message
      chatbotMessages.innerHTML = "";

      // Restore all messages
      chatData.messages.forEach(msg => {
        addMessageToDOM(msg.text, msg.isUser, false); // false = don't save (we're loading)
      });

      return true;
    } catch (e) {
      console.error("Error loading chat history:", e);
      return false;
    }
  }

  // Add message to DOM (internal function)
  function addMessageToDOM(text, isUser = false, shouldSave = true) {
    if (!chatbotMessages) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message ${isUser ? "user-message" : "bot-message"}`;
    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${text.replace(/\n/g, "<br>")}</p>
      </div>
    `;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
    if (shouldSave) {
      saveChatHistory();
    }
  }

  // Function to add message to chat (public API)
  function addMessage(text, isUser = false) {
    addMessageToDOM(text, isUser, true);
  }

  // Show typing indicator
  function showTypingIndicator() {
    if (!chatbotMessages) return;
    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-message bot-message typing-indicator";
    typingDiv.id = "typing-indicator";
    typingDiv.innerHTML = `
      <div class="message-content">
        <p><span class="typing-dots"><span>.</span><span>.</span><span>.</span></span></p>
      </div>
    `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  // Function to send message
  async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatbotInput.value = "";

    // Disable input while processing
    if (chatbotInput) chatbotInput.disabled = true;
    if (chatbotSend) chatbotSend.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    try {
      // Try AI first
      let response = await getAIResponse(message);
      
      // Fall back to keyword matching if AI fails
      if (!response) {
        console.log('⚠️ Using keyword matching fallback (Ollama not available or failed)');
        response = findResponse(message);
      } else {
        console.log('✅ Using Ollama AI response');
      }

      // Remove typing indicator and add response
      removeTypingIndicator();
      addMessage(response);
    } catch (error) {
      console.error("Error getting response:", error);
      removeTypingIndicator();
      // Fall back to keyword matching on error
      const fallbackResponse = findResponse(message);
      addMessage(fallbackResponse);
    } finally {
      // Re-enable input
      if (chatbotInput) chatbotInput.disabled = false;
      if (chatbotSend) chatbotSend.disabled = false;
      if (chatbotInput) chatbotInput.focus();
    }
  }

  // Initialize: Load chat history on page load
  if (chatbotMessages) {
    const hasHistory = loadChatHistory();
    // If no history was loaded, keep the default welcome message
    // (it's already in the HTML)
  }

  // Save chatbot state (open/closed)
  function saveChatbotState(isOpen) {
    localStorage.setItem("apex_chatbot_open", isOpen ? "true" : "false");
  }

  // Load chatbot state
  function loadChatbotState() {
    const saved = localStorage.getItem("apex_chatbot_open");
    if (saved === "true" && chatbotWidget && chatbotToggle) {
      chatbotWidget.classList.add("open");
      chatbotToggle.classList.add("hidden");
      chatbotWidget.setAttribute("aria-hidden", "false");
      chatbotToggle.setAttribute("aria-expanded", "true");
    } else if (chatbotWidget && chatbotToggle) {
      chatbotWidget.setAttribute("aria-hidden", "true");
      chatbotToggle.setAttribute("aria-expanded", "false");
    }
  }

  // Toggle chatbot
  if (chatbotToggle) {
    chatbotToggle.addEventListener("click", () => {
      chatbotWidget.classList.add("open");
      chatbotToggle.classList.add("hidden");
      chatbotWidget.setAttribute("aria-hidden", "false");
      chatbotToggle.setAttribute("aria-expanded", "true");
      chatbotInput.focus();
      saveChatbotState(true);
    });
  }

  // Close chatbot
  if (chatbotClose) {
    chatbotClose.addEventListener("click", () => {
      chatbotWidget.classList.remove("open");
      chatbotToggle.classList.remove("hidden");
      chatbotWidget.setAttribute("aria-hidden", "true");
      chatbotToggle.setAttribute("aria-expanded", "false");
      chatbotToggle.focus();
      saveChatbotState(false);
    });
  }

  // Close chatbot on Escape key
  if (chatbotWidget) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && chatbotWidget.classList.contains("open")) {
        chatbotWidget.classList.remove("open");
        chatbotToggle.classList.remove("hidden");
        chatbotWidget.setAttribute("aria-hidden", "true");
        chatbotToggle.setAttribute("aria-expanded", "false");
        chatbotToggle.focus();
        saveChatbotState(false);
      }
    });
  }

  // Load chatbot state on page load
  loadChatbotState();

  // Update chatbot status indicator
  function updateChatbotStatus() {
    const statusElement = document.querySelector('.chatbot-status');
    if (!statusElement) return;
    
    if (!AI_CONFIG.enabled) {
      statusElement.textContent = 'Keyword Matching';
      statusElement.style.color = 'var(--muted)';
      return;
    }
    
    // Test connection asynchronously
    const baseUrl = getOllamaUrl();
    fetch(`${baseUrl}/api/tags`)
      .then(response => {
        if (response.ok) {
          statusElement.textContent = 'AI Active';
          statusElement.style.color = '#22c55e'; // Green
        } else {
          statusElement.textContent = 'AI Offline';
          statusElement.style.color = '#ef4444'; // Red
        }
      })
      .catch(() => {
        statusElement.textContent = 'AI Offline';
        statusElement.style.color = '#ef4444'; // Red
      });
  }

  // Update status on page load
  updateChatbotStatus();
  
  // Update status every 30 seconds
  setInterval(updateChatbotStatus, 30000);

  // Verify functions are available (for debugging)
  if (typeof window.testChatbotAI === 'function' && typeof window.checkChatbotAI === 'function') {
    console.log('✅ Chatbot helper functions loaded:', {
      testChatbotAI: 'Available - Run testChatbotAI() to test Ollama',
      checkChatbotAI: 'Available - Run checkChatbotAI() to check status',
      setChatbotOllamaUrl: 'Available - Run setChatbotOllamaUrl(url) to change URL',
      setChatbotModel: 'Available - Run setChatbotModel(name) to change model'
    });
  }

  // Send button
  if (chatbotSend) {
    chatbotSend.addEventListener("click", sendMessage);
  }

  // Enter key to send
  if (chatbotInput) {
    chatbotInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }

  // Quick reply buttons
  quickReplyBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const question = btn.getAttribute("data-question");
      addMessage(question, true);
      
      // Disable input while processing
      if (chatbotInput) chatbotInput.disabled = true;
      if (chatbotSend) chatbotSend.disabled = true;
      
      showTypingIndicator();
      
      try {
        let response = await getAIResponse(question);
        if (!response) {
          response = findResponse(question);
        }
        removeTypingIndicator();
        addMessage(response);
      } catch (error) {
        console.error("Error getting response:", error);
        removeTypingIndicator();
        const fallbackResponse = findResponse(question);
        addMessage(fallbackResponse);
      } finally {
        if (chatbotInput) chatbotInput.disabled = false;
        if (chatbotSend) chatbotSend.disabled = false;
        if (chatbotInput) chatbotInput.focus();
      }
    });
  });
}

// ============================================
// CLIENT PORTAL AUTHENTICATION
// ============================================

// Authentication state management
const Auth = {
  // Demo credentials (in production, this would be handled by a backend)
  DEMO_CREDENTIALS: {
    'demo@apextsgroup.com': { password: 'demo123', name: 'Demo Client', clientId: 'demo-001' },
    'client@example.com': { password: 'client123', name: 'John Smith', clientId: 'client-002' }
  },

  // Get current session
  getSession() {
    const session = localStorage.getItem('client_session');
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // Set session
  setSession(email, userData) {
    const session = {
      email,
      name: userData.name,
      clientId: userData.clientId,
      loginTime: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    localStorage.setItem('client_session', JSON.stringify(session));
    return session;
  },

  // Clear session
  clearSession() {
    localStorage.removeItem('client_session');
  },

  // Check if session is valid
  isValidSession() {
    const session = this.getSession();
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.clearSession();
      return false;
    }
    return true;
  },

  // Authenticate user
  authenticate(email, password) {
    const user = this.DEMO_CREDENTIALS[email.toLowerCase()];
    if (user && user.password === password) {
      return this.setSession(email, user);
    }
    return null;
  },

  // Get demo client data
  getClientData(clientId) {
    // Mock data - in production, this would come from an API
    const mockData = {
      'demo-001': {
        name: 'Demo Client',
        email: 'demo@apextsgroup.com',
        plan: {
          name: 'Professional',
          monthlyLimit: 1000, // messages per month
          price: 99,
          overageRate: 0.10 // $0.10 per message over limit
        },
        usage: {
          currentMonth: 1247,
          lastMonth: 892,
          totalMessages: 5234,
          totalSessions: 342,
          averageResponseTime: 1.2,
          satisfaction: 4.6
        },
        billing: {
          currentBill: 124.70,
          basePrice: 99,
          overageMessages: 247,
          overageCost: 24.70,
          nextBillingDate: '2024-04-01',
          paymentMethod: {
            type: 'card',
            last4: '4242',
            brand: 'Visa',
            expiryMonth: 12,
            expiryYear: 2025,
            name: 'Demo Client'
          },
          billingAddress: {
            line1: '123 Business St',
            line2: 'Suite 100',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States'
          },
          billingHistory: [
            {
              id: 'inv-003',
              date: '2024-03-01',
              amount: 112.30,
              status: 'paid',
              basePrice: 99,
              overageCost: 13.30,
              overageMessages: 133,
              invoiceUrl: '#'
            },
            {
              id: 'inv-002',
              date: '2024-02-01',
              amount: 99.00,
              status: 'paid',
              basePrice: 99,
              overageCost: 0,
              overageMessages: 0,
              invoiceUrl: '#'
            },
            {
              id: 'inv-001',
              date: '2024-01-01',
              amount: 108.50,
              status: 'paid',
              basePrice: 99,
              overageCost: 9.50,
              overageMessages: 95,
              invoiceUrl: '#'
            }
          ]
        },
        chatSessions: [
          {
            id: 'chat-001',
            visitorName: 'Sarah Johnson',
            visitorEmail: 'sarah@example.com',
            startTime: '2024-03-28T14:23:00',
            endTime: '2024-03-28T14:35:00',
            duration: 12,
            messageCount: 8,
            status: 'completed',
            rating: 5,
            messages: [
              { role: 'user', content: 'Hi, I need help with pricing', timestamp: '2024-03-28T14:23:15' },
              { role: 'assistant', content: 'Hello! I\'d be happy to help you with pricing information. What type of project are you interested in?', timestamp: '2024-03-28T14:23:18' },
              { role: 'user', content: 'I need a website for my business', timestamp: '2024-03-28T14:24:02' },
              { role: 'assistant', content: 'Great! For websites, our pricing typically ranges from $2,000 to $5,000 depending on complexity. Would you like to schedule a consultation?', timestamp: '2024-03-28T14:24:05' },
              { role: 'user', content: 'Yes, that would be helpful', timestamp: '2024-03-28T14:25:10' },
              { role: 'assistant', content: 'Perfect! You can fill out our contact form or email us at info@apextsgroup.com. We typically respond within 24 hours.', timestamp: '2024-03-28T14:25:13' },
              { role: 'user', content: 'Thank you!', timestamp: '2024-03-28T14:25:45' },
              { role: 'assistant', content: 'You\'re welcome! Have a great day!', timestamp: '2024-03-28T14:25:47' }
            ]
          },
          {
            id: 'chat-002',
            visitorName: 'Mike Chen',
            visitorEmail: 'mike@techcorp.com',
            startTime: '2024-03-28T15:10:00',
            endTime: null,
            duration: 0,
            messageCount: 3,
            status: 'active',
            rating: null,
            messages: [
              { role: 'user', content: 'What technologies do you use?', timestamp: '2024-03-28T15:10:12' },
              { role: 'assistant', content: 'We use modern technologies like React, Vue, Node.js, Python, and cloud platforms like AWS and Azure.', timestamp: '2024-03-28T15:10:15' },
              { role: 'user', content: 'Do you work with Python specifically?', timestamp: '2024-03-28T15:11:30' }
            ]
          },
          {
            id: 'chat-003',
            visitorName: 'Anonymous',
            visitorEmail: null,
            startTime: '2024-03-27T10:15:00',
            endTime: '2024-03-27T10:18:00',
            duration: 3,
            messageCount: 4,
            status: 'completed',
            rating: 4,
            messages: [
              { role: 'user', content: 'How long does a project take?', timestamp: '2024-03-27T10:15:20' },
              { role: 'assistant', content: 'Project timelines vary: Simple websites take 2-4 weeks, custom applications take 6-12 weeks or more.', timestamp: '2024-03-27T10:15:23' },
              { role: 'user', content: 'Thanks', timestamp: '2024-03-27T10:17:45' },
              { role: 'assistant', content: 'You\'re welcome!', timestamp: '2024-03-27T10:17:47' }
            ]
          },
          {
            id: 'chat-005',
            visitorName: 'Emily Rodriguez',
            visitorEmail: 'emily@designstudio.com',
            startTime: '2024-03-26T09:30:00',
            endTime: '2024-03-26T09:45:00',
            duration: 15,
            messageCount: 12,
            status: 'completed',
            rating: 5,
            messages: [
              { role: 'user', content: 'I need a custom web application for my design studio', timestamp: '2024-03-26T09:30:15' },
              { role: 'assistant', content: 'That sounds great! Can you tell me more about what features you need?', timestamp: '2024-03-26T09:30:18' }
            ]
          },
          {
            id: 'chat-006',
            visitorName: 'David Kim',
            visitorEmail: 'david@startup.io',
            startTime: '2024-03-25T14:20:00',
            endTime: '2024-03-25T14:32:00',
            duration: 12,
            messageCount: 10,
            status: 'completed',
            rating: 5,
            messages: [
              { role: 'user', content: 'Do you offer automation services?', timestamp: '2024-03-25T14:20:10' },
              { role: 'assistant', content: 'Yes! We specialize in workflow automation and integrations.', timestamp: '2024-03-25T14:20:13' }
            ]
          },
          {
            id: 'chat-007',
            visitorName: 'Lisa Wang',
            visitorEmail: 'lisa@ecommerce.com',
            startTime: '2024-03-24T11:00:00',
            endTime: '2024-03-24T11:18:00',
            duration: 18,
            messageCount: 14,
            status: 'completed',
            rating: 4,
            messages: [
              { role: 'user', content: 'I need help with my e-commerce site', timestamp: '2024-03-24T11:00:15' },
              { role: 'assistant', content: 'I can help with that! What specific issues are you experiencing?', timestamp: '2024-03-24T11:00:18' }
            ]
          },
          {
            id: 'chat-008',
            visitorName: 'Robert Taylor',
            visitorEmail: 'robert@consulting.com',
            startTime: '2024-03-23T16:45:00',
            endTime: '2024-03-23T16:50:00',
            duration: 5,
            messageCount: 6,
            status: 'completed',
            rating: 5,
            messages: [
              { role: 'user', content: 'What is your pricing structure?', timestamp: '2024-03-23T16:45:10' },
              { role: 'assistant', content: 'Our pricing varies by project type. Would you like to schedule a consultation?', timestamp: '2024-03-23T16:45:13' }
            ]
          },
          {
            id: 'chat-009',
            visitorName: 'Anonymous',
            visitorEmail: null,
            startTime: '2024-03-22T13:15:00',
            endTime: '2024-03-22T13:20:00',
            duration: 5,
            messageCount: 4,
            status: 'completed',
            rating: null,
            messages: [
              { role: 'user', content: 'Do you work with small businesses?', timestamp: '2024-03-22T13:15:15' },
              { role: 'assistant', content: 'Absolutely! We work with businesses of all sizes.', timestamp: '2024-03-22T13:15:18' }
            ]
          },
          {
            id: 'chat-010',
            visitorName: 'Jennifer Martinez',
            visitorEmail: 'jennifer@agency.com',
            startTime: '2024-03-21T10:30:00',
            endTime: '2024-03-21T10:48:00',
            duration: 18,
            messageCount: 16,
            status: 'completed',
            rating: 5,
            messages: [
              { role: 'user', content: 'I need a complete website redesign', timestamp: '2024-03-21T10:30:15' },
              { role: 'assistant', content: 'We can help with that! Let me gather some information about your current site.', timestamp: '2024-03-21T10:30:18' }
            ]
          }
        ],
        services: [
          {
            id: 'svc-001',
            name: 'Website Development',
            status: 'active',
            progress: 85,
            startDate: '2024-01-15',
            description: 'Custom website with e-commerce integration',
            lastUpdate: '2024-03-20'
          },
          {
            id: 'svc-002',
            name: 'Automation System',
            status: 'active',
            progress: 100,
            startDate: '2024-02-01',
            description: 'Workflow automation for order processing',
            lastUpdate: '2024-03-15'
          },
          {
            id: 'svc-003',
            name: 'Maintenance & Support',
            status: 'active',
            progress: 100,
            startDate: '2024-01-01',
            description: 'Monthly maintenance and support package',
            lastUpdate: '2024-03-25'
          }
        ],
        reports: [
          {
            id: 'rpt-001',
            title: 'Monthly Performance Report - March 2024',
            date: '2024-03-25',
            type: 'performance',
            summary: 'Website uptime: 99.9%, Average load time: 1.2s, Traffic increase: 15%'
          },
          {
            id: 'rpt-002',
            title: 'Automation System Analysis',
            date: '2024-03-15',
            type: 'analysis',
            summary: 'Processed 1,250 orders automatically, Saved 45 hours of manual work'
          },
          {
            id: 'rpt-003',
            title: 'Security Audit Report',
            date: '2024-03-10',
            type: 'security',
            summary: 'All systems secure, No vulnerabilities detected, SSL certificate valid'
          }
        ],
        stats: {
          totalServices: 3,
          completedProjects: 2,
          uptime: 99.9
        },
        assets: [
          {
            id: 'asset-001',
            name: 'AI Chatbot',
            description: 'Intelligent customer support chatbot with natural language processing',
            icon: '🤖',
            status: 'active',
            loginUrl: '/chatbot/login/',
            lastActive: '2024-03-28T14:30:00'
          },
          {
            id: 'asset-002',
            name: 'AI Data Cleaner',
            description: 'Automated data cleaning and validation tool',
            icon: '🧹',
            status: 'active',
            loginUrl: 'https://datacleaner.apextsgroup.com/login',
            lastActive: '2024-03-27T10:15:00'
          }
        ],
        availableProducts: [
          {
            id: 'prod-001',
            name: 'AI Content Generator',
            description: 'Generate high-quality content automatically using AI',
            icon: '✍️',
            price: '$79/month',
            features: ['Unlimited content generation', 'Multiple formats', 'SEO optimization']
          },
          {
            id: 'prod-002',
            name: 'Analytics Dashboard',
            description: 'Advanced analytics and reporting for all your assets',
            icon: '📊',
            price: '$49/month',
            features: ['Real-time metrics', 'Custom reports', 'Data export']
          },
          {
            id: 'prod-003',
            name: 'API Integration Suite',
            description: 'Connect all your tools with powerful API integrations',
            icon: '🔌',
            price: '$99/month',
            features: ['Unlimited integrations', 'Webhook support', 'Custom endpoints']
          }
        ]
      },
      'client-002': {
        name: 'John Smith',
        email: 'client@example.com',
        plan: {
          name: 'Starter',
          monthlyLimit: 500,
          price: 49,
          overageRate: 0.15
        },
        usage: {
          currentMonth: 342,
          lastMonth: 298,
          totalMessages: 1234,
          totalSessions: 89,
          averageResponseTime: 1.5,
          satisfaction: 4.3
        },
        billing: {
          currentBill: 49.00,
          basePrice: 49,
          overageMessages: 0,
          overageCost: 0,
          nextBillingDate: '2024-04-01',
          paymentMethod: {
            type: 'card',
            last4: '8888',
            brand: 'Mastercard',
            expiryMonth: 6,
            expiryYear: 2026,
            name: 'John Smith'
          },
          billingAddress: {
            line1: '456 Main Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90001',
            country: 'United States'
          },
          billingHistory: [
            {
              id: 'inv-006',
              date: '2024-03-01',
              amount: 49.00,
              status: 'paid',
              basePrice: 49,
              overageCost: 0,
              overageMessages: 0,
              invoiceUrl: '#'
            },
            {
              id: 'inv-005',
              date: '2024-02-01',
              amount: 49.00,
              status: 'paid',
              basePrice: 49,
              overageCost: 0,
              overageMessages: 0,
              invoiceUrl: '#'
            }
          ]
        },
        chatSessions: [
          {
            id: 'chat-004',
            visitorName: 'Alex Martinez',
            visitorEmail: 'alex@startup.com',
            startTime: '2024-03-28T16:20:00',
            endTime: '2024-03-28T16:25:00',
            duration: 5,
            messageCount: 6,
            status: 'completed',
            rating: 5,
            messages: [
              { role: 'user', content: 'I need help with automation', timestamp: '2024-03-28T16:20:15' },
              { role: 'assistant', content: 'I can help with automation! What processes would you like to automate?', timestamp: '2024-03-28T16:20:18' },
              { role: 'user', content: 'Order processing and inventory updates', timestamp: '2024-03-28T16:21:30' },
              { role: 'assistant', content: 'Great! We can automate order processing and sync inventory in real-time. Would you like to schedule a consultation?', timestamp: '2024-03-28T16:21:33' },
              { role: 'user', content: 'Yes please', timestamp: '2024-03-28T16:22:10' },
              { role: 'assistant', content: 'Perfect! Please fill out our contact form and we\'ll get back to you within 24 hours.', timestamp: '2024-03-28T16:22:13' }
            ]
          }
        ],
        services: [
          {
            id: 'svc-004',
            name: 'Custom Web Application',
            status: 'in-progress',
            progress: 60,
            startDate: '2024-02-20',
            description: 'Internal portal for team management',
            lastUpdate: '2024-03-22'
          }
        ],
        reports: [
          {
            id: 'rpt-004',
            title: 'Project Status Update - March 2024',
            date: '2024-03-22',
            type: 'status',
            summary: 'Development 60% complete, Testing phase scheduled for next week'
          }
        ],
        stats: {
          totalServices: 1,
          completedProjects: 0,
          uptime: 100
        },
        assets: [
          {
            id: 'asset-003',
            name: 'AI Chatbot',
            description: 'Intelligent customer support chatbot',
            icon: '🤖',
            status: 'active',
            loginUrl: '/chatbot/login/',
            lastActive: '2024-03-28T16:20:00'
          }
        ],
        availableProducts: [
          {
            id: 'prod-001',
            name: 'AI Data Cleaner',
            description: 'Automated data cleaning and validation tool',
            icon: '🧹',
            price: '$59/month',
            features: ['Data validation', 'Duplicate removal', 'Format standardization']
          },
          {
            id: 'prod-002',
            name: 'AI Content Generator',
            description: 'Generate high-quality content automatically using AI',
            icon: '✍️',
            price: '$79/month',
            features: ['Unlimited content generation', 'Multiple formats', 'SEO optimization']
          },
          {
            id: 'prod-003',
            name: 'Analytics Dashboard',
            description: 'Advanced analytics and reporting for all your assets',
            icon: '📊',
            price: '$49/month',
            features: ['Real-time metrics', 'Custom reports', 'Data export']
          },
          {
            id: 'prod-004',
            name: 'API Integration Suite',
            description: 'Connect all your tools with powerful API integrations',
            icon: '🔌',
            price: '$99/month',
            features: ['Unlimited integrations', 'Webhook support', 'Custom endpoints']
          }
        ]
      }
    };
    
    // Add default values if missing
    const client = mockData[clientId] || mockData['demo-001'];
    if (!client.plan) {
      client.plan = { name: 'Basic', monthlyLimit: 500, price: 49, overageRate: 0.15 };
    }
    if (!client.usage) {
      client.usage = { currentMonth: 0, lastMonth: 0, totalMessages: 0, totalSessions: 0, averageResponseTime: 0, satisfaction: 0 };
    }
    if (!client.billing) {
      client.billing = { 
        currentBill: client.plan.price, 
        basePrice: client.plan.price, 
        overageMessages: 0, 
        overageCost: 0, 
        nextBillingDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        paymentMethod: {
          type: 'card',
          last4: '0000',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: new Date().getFullYear() + 1,
          name: client.name || 'Client'
        },
        billingAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          zip: '',
          country: 'United States'
        },
        billingHistory: []
      };
    }
    if (!client.chatSessions) {
      client.chatSessions = [];
    }
    if (!client.assets) {
      client.assets = [];
    }
    // Master list of all available products
    const allAvailableProducts = [
      {
        id: 'prod-001',
        name: 'AI Data Cleaner',
        description: 'Automated data cleaning and validation tool',
        icon: '🧹',
        price: '$59/month',
        features: ['Data validation', 'Duplicate removal', 'Format standardization']
      },
      {
        id: 'prod-002',
        name: 'AI Content Generator',
        description: 'Generate high-quality content automatically using AI',
        icon: '✍️',
        price: '$79/month',
        features: ['Unlimited content generation', 'Multiple formats', 'SEO optimization']
      },
      {
        id: 'prod-003',
        name: 'Analytics Dashboard',
        description: 'Advanced analytics and reporting for all your assets',
        icon: '📊',
        price: '$49/month',
        features: ['Real-time metrics', 'Custom reports', 'Data export']
      },
      {
        id: 'prod-004',
        name: 'API Integration Suite',
        description: 'Connect all your tools with powerful API integrations',
        icon: '🔌',
        price: '$99/month',
        features: ['Unlimited integrations', 'Webhook support', 'Custom endpoints']
      },
      {
        id: 'prod-005',
        name: 'AI Chatbot',
        description: 'Intelligent customer support chatbot with natural language processing',
        icon: '🤖',
        price: '$99/month',
        features: ['24/7 support', 'Natural language processing', 'Custom training']
      }
    ];
    
    // If client has custom availableProducts, use those; otherwise filter from master list
    if (!client.availableProducts) {
      // Filter out products the client already has
      const assetNames = (client.assets || []).map(a => a.name.toLowerCase());
      client.availableProducts = allAvailableProducts.filter(p => 
        !assetNames.includes(p.name.toLowerCase())
      );
    } else {
      // If client has custom list, still filter out what they already have
      const assetNames = (client.assets || []).map(a => a.name.toLowerCase());
      client.availableProducts = client.availableProducts.filter(p => 
        !assetNames.includes(p.name.toLowerCase())
      );
    }
    
    return client;
  }
};

// Update navigation to show login/dashboard link
function updateNavigation() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const isLoggedIn = Auth.isValidSession();
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes('/login/');
  const isDashboardPage = currentPath.includes('/dashboard/');

  // Remove existing login/dashboard link or button
  const existingLink = nav.querySelector('a[href="/login/"], a[href="/dashboard/"], button.nav-portal-btn');
  if (existingLink) {
    existingLink.remove();
  }

  // Add appropriate button
  if (isLoggedIn && !isDashboardPage) {
    const dashboardLink = document.createElement('a');
    dashboardLink.href = '/dashboard/';
    dashboardLink.className = 'nav-portal-btn btn primary';
    dashboardLink.textContent = 'Client Portal';
    if (isDashboardPage) {
      dashboardLink.classList.add('active');
    }
    nav.appendChild(dashboardLink);
  } else if (!isLoggedIn && !isLoginPage) {
    const loginLink = document.createElement('a');
    loginLink.href = '/login/';
    loginLink.className = 'nav-portal-btn btn primary';
    loginLink.textContent = 'Client Portal';
    nav.appendChild(loginLink);
  }
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');
    const buttonText = document.getElementById('login-button-text');
    const loadingText = document.getElementById('login-loading');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');

    // Validation
    if (!email || !password) {
      errorDiv.textContent = 'Please fill in all fields';
      errorDiv.style.display = 'block';
      if (!email) emailInput.classList.add('error');
      if (!password) passwordInput.classList.add('error');
      return;
    }

    // Show loading state
    buttonText.style.display = 'none';
    loadingText.style.display = 'inline';

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Authenticate
    const session = Auth.authenticate(email, password);
    
    if (session) {
      // Success - redirect to dashboard
      window.location.href = '/dashboard/';
    } else {
      // Error
      errorDiv.textContent = 'Invalid email or password. Please try again.';
      errorDiv.style.display = 'block';
      emailInput.classList.add('error');
      passwordInput.classList.add('error');
      buttonText.style.display = 'inline';
      loadingText.style.display = 'none';
    }
  });
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to sign out?')) {
    Auth.clearSession();
    window.location.href = '/login/';
  }
}

// Dashboard initialization
function initDashboard() {
  const session = Auth.getSession();
  
  if (!session || !Auth.isValidSession()) {
    window.location.href = '/login/';
    return;
  }

  // Get client data
  const clientData = Auth.getClientData(session.clientId);
  
  // Update header
  const clientNameEl = document.getElementById('client-name');
  if (clientNameEl) {
    clientNameEl.textContent = clientData.name;
  }

  // Initialize tabs
  initDashboardTabs();
  
  // Render billing summary (overview tab)
  renderBillingSummary(clientData);
  
  // Render assets (overview tab)
  renderAssets(clientData);
  
  // Render available products (overview tab)
  renderAvailableProducts(clientData);
  
  // Render billing tab content (detailed billing)
  renderBillingTabContent(clientData);
}

// Dashboard tabs functionality
function initDashboardTabs() {
  const tabs = document.querySelectorAll('.dashboard-tab');
  const tabContents = document.querySelectorAll('.dashboard-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Render chat sessions
function renderChatSessions(clientData) {
  const container = document.getElementById('chat-sessions-container');
  if (!container || !clientData.chatSessions) return;
  
  const sessions = clientData.chatSessions.sort((a, b) => {
    return new Date(b.startTime) - new Date(a.startTime);
  });
  
  container.innerHTML = sessions.map(session => {
    const startDate = new Date(session.startTime);
    const statusBadge = session.status === 'active' 
      ? '<span class="status-badge active">Active</span>'
      : '<span class="status-badge completed">Completed</span>';
    const ratingStars = session.rating 
      ? '⭐'.repeat(session.rating) + ' (' + session.rating + '/5)'
      : 'No rating';
    
    return `
      <div class="chat-session-card" data-session-id="${session.id}">
        <div class="chat-session-header">
          <div>
            <h3 style="margin:0 0 4px;font-size:18px;">${session.visitorName || 'Anonymous Visitor'}</h3>
            <p style="margin:0;color:var(--muted);font-size:14px;">
              ${session.visitorEmail || 'No email provided'} • ${startDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          ${statusBadge}
        </div>
        <div class="chat-session-stats">
          <span>💬 ${session.messageCount} messages</span>
          <span>⏱️ ${session.duration || 'Ongoing'} min</span>
          <span>${ratingStars}</span>
        </div>
        <div class="chat-session-preview">
          <p style="margin:0;color:var(--muted);font-size:13px;font-style:italic;">
            "${session.messages[0]?.content.substring(0, 80)}${session.messages[0]?.content.length > 80 ? '...' : ''}"
          </p>
        </div>
        <div class="chat-session-actions">
          <button class="btn" onclick="viewChatSession('${session.id}')">View Full Chat</button>
          ${session.status === 'active' ? `<button class="btn primary" onclick="takeoverChat('${session.id}')">Take Over</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// View full chat session
function viewChatSession(sessionId) {
  const session = getChatSession(sessionId);
  if (!session) return;
  
  const modal = document.createElement('div');
  modal.className = 'chat-modal';
  modal.innerHTML = `
    <div class="chat-modal-content">
      <div class="chat-modal-header">
        <h2>Chat Session: ${session.visitorName || 'Anonymous'}</h2>
        <button class="chat-modal-close" onclick="this.closest('.chat-modal').remove()">✕</button>
      </div>
      <div class="chat-modal-body">
        <div class="chat-session-info">
          <p><strong>Started:</strong> ${new Date(session.startTime).toLocaleString()}</p>
          ${session.endTime ? `<p><strong>Ended:</strong> ${new Date(session.endTime).toLocaleString()}</p>` : '<p><strong>Status:</strong> Active</p>'}
          <p><strong>Duration:</strong> ${session.duration || 'Ongoing'} minutes</p>
          <p><strong>Messages:</strong> ${session.messageCount}</p>
          ${session.rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(session.rating)} (${session.rating}/5)</p>` : ''}
        </div>
        <div class="chat-messages-view">
          ${session.messages.map(msg => `
            <div class="chat-message-view ${msg.role === 'user' ? 'user-msg' : 'bot-msg'}">
              <div class="chat-msg-header">
                <strong>${msg.role === 'user' ? session.visitorName || 'Visitor' : 'AI Assistant'}</strong>
                <span style="color:var(--muted);font-size:12px;">${new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div class="chat-msg-content">${msg.content}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ${session.status === 'active' ? `
        <div class="chat-modal-footer">
          <button class="btn primary" onclick="takeoverChat('${sessionId}'); this.closest('.chat-modal').remove();">Take Over Chat</button>
        </div>
      ` : ''}
    </div>
  `;
  document.body.appendChild(modal);
}

// Take over chat session
function takeoverChat(sessionId) {
  const session = getChatSession(sessionId);
  if (!session) return;
  
  if (confirm(`Take over this chat session with ${session.visitorName || 'Anonymous Visitor'}? You will be able to respond manually.`)) {
    // In production, this would send a request to the backend
    alert('Chat takeover initiated! You can now respond manually to this conversation.');
    // Update session status
    session.status = 'taken-over';
    renderChatSessions(Auth.getClientData(Auth.getSession().clientId));
  }
}

// Get chat session by ID
function getChatSession(sessionId) {
  const clientData = Auth.getClientData(Auth.getSession().clientId);
  return clientData.chatSessions?.find(s => s.id === sessionId);
}

// Render usage reports
function renderUsageReports(clientData) {
  const container = document.getElementById('usage-reports-container');
  if (!container || !clientData.usage) return;
  
  const usage = clientData.usage;
  const usagePercent = ((usage.currentMonth / (clientData.plan?.monthlyLimit || 1000)) * 100).toFixed(1);
  const isOverLimit = usage.currentMonth > (clientData.plan?.monthlyLimit || 1000);
  
  container.innerHTML = `
    <div class="usage-overview">
      <div class="usage-stat-card">
        <div class="usage-stat-icon">💬</div>
        <div class="usage-stat-content">
          <div class="usage-stat-value">${usage.currentMonth.toLocaleString()}</div>
          <div class="usage-stat-label">Messages This Month</div>
          <div class="usage-stat-sublabel ${isOverLimit ? 'over-limit' : ''}">
            ${isOverLimit ? `⚠️ ${usagePercent}% of limit` : `${usagePercent}% of monthly limit`}
          </div>
        </div>
      </div>
      <div class="usage-stat-card">
        <div class="usage-stat-icon">📊</div>
        <div class="usage-stat-content">
          <div class="usage-stat-value">${usage.totalMessages.toLocaleString()}</div>
          <div class="usage-stat-label">Total Messages</div>
          <div class="usage-stat-sublabel">All time</div>
        </div>
      </div>
      <div class="usage-stat-card">
        <div class="usage-stat-icon">👥</div>
        <div class="usage-stat-content">
          <div class="usage-stat-value">${usage.totalSessions}</div>
          <div class="usage-stat-label">Total Sessions</div>
          <div class="usage-stat-sublabel">${usage.lastMonth} last month</div>
        </div>
      </div>
      <div class="usage-stat-card">
        <div class="usage-stat-icon">⚡</div>
        <div class="usage-stat-content">
          <div class="usage-stat-value">${usage.averageResponseTime}s</div>
          <div class="usage-stat-label">Avg Response Time</div>
          <div class="usage-stat-sublabel">${usage.satisfaction ? '⭐ ' + usage.satisfaction + '/5' : 'N/A'}</div>
        </div>
      </div>
    </div>
    
    <div class="usage-chart-container">
      <h3 style="margin:0 0 16px;font-size:20px;">Monthly Usage Trend</h3>
      <div class="usage-chart">
        <div class="usage-bar" style="height:${Math.min((usage.currentMonth / (clientData.plan?.monthlyLimit || 1000)) * 100, 100)}%">
          <span class="usage-bar-label">This Month: ${usage.currentMonth}</span>
        </div>
        <div class="usage-bar" style="height:${(usage.lastMonth / (clientData.plan?.monthlyLimit || 1000)) * 100}%">
          <span class="usage-bar-label">Last Month: ${usage.lastMonth}</span>
        </div>
      </div>
      <div class="usage-chart-labels">
        <span>This Month</span>
        <span>Last Month</span>
      </div>
    </div>
  `;
}

// Render billing summary (for overview tab)
function renderBillingSummary(clientData) {
  const container = document.getElementById('billing-summary');
  if (!container || !clientData.billing || !clientData.plan) return;
  
  const billing = clientData.billing;
  const plan = clientData.plan;
  const usage = clientData.usage || { currentMonth: 0 };
  const usagePercent = ((usage.currentMonth / plan.monthlyLimit) * 100).toFixed(1);
  const isOverLimit = usage.currentMonth > plan.monthlyLimit;
  
  container.innerHTML = `
    <div class="billing-summary-content">
      <div class="billing-summary-main">
        <div class="billing-summary-icon">💳</div>
        <div class="billing-summary-info">
          <h3 style="margin:0 0 4px;font-size:24px;">Current Bill: $${billing.currentBill.toFixed(2)}</h3>
          <p style="margin:0;color:var(--muted);font-size:14px;">
            ${plan.name} Plan - Base: $${billing.basePrice.toFixed(2)}${billing.overageCost > 0 ? ` + Overage: $${billing.overageCost.toFixed(2)}` : ''}
          </p>
        </div>
      </div>
      <div class="billing-summary-details">
        <div class="billing-detail-item">
          <span class="billing-detail-label">Usage:</span>
          <span class="billing-detail-value ${isOverLimit ? 'over-limit' : ''}">
            ${usage.currentMonth.toLocaleString()} / ${plan.monthlyLimit.toLocaleString()} (${usagePercent}%)
          </span>
        </div>
        <div class="billing-detail-item">
          <span class="billing-detail-label">Next Billing:</span>
          <span class="billing-detail-value">${new Date(billing.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  `;
}

// Render client assets/products
function renderAssets(clientData) {
  const container = document.getElementById('assets-container');
  if (!container) return;
  
  const assets = clientData.assets || [];
  
  if (assets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3 style="margin:16px 0 8px;font-size:20px;">No Assets Yet</h3>
        <p style="margin:0;color:var(--muted);">You don't have any active assets. Check out our available products below!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = assets.map(asset => {
    const lastActive = asset.lastActive ? new Date(asset.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never';
    return `
      <div class="asset-card">
        <div class="asset-header">
          <div class="asset-icon">${asset.icon}</div>
          <div class="asset-info">
            <h3 style="margin:0 0 4px;font-size:20px;">${asset.name}</h3>
            <p style="margin:0;color:var(--muted);font-size:14px;">${asset.description}</p>
          </div>
          <span class="asset-status status-${asset.status}">${asset.status === 'active' ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="asset-meta">
          <span style="color:var(--muted);font-size:13px;">Last Active: ${lastActive}</span>
        </div>
        <div class="asset-actions">
          <a href="${asset.loginUrl}" target="_blank" class="btn primary" style="width:100%;">Access Product →</a>
        </div>
      </div>
    `;
  }).join('');
}

// Render available products (upsell section)
function renderAvailableProducts(clientData) {
  const container = document.getElementById('products-container');
  if (!container) return;
  
  const products = clientData.availableProducts || [];
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <h3 style="margin:16px 0 8px;font-size:20px;">You Have All Products!</h3>
        <p style="margin:0;color:var(--muted);">You're already using all available products. We'll notify you when new products are released!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = products.map(product => {
    const featuresList = product.features.map(f => `<li>${f}</li>`).join('');
    return `
      <div class="product-card">
        <div class="product-header">
          <div class="product-icon">${product.icon}</div>
          <div class="product-info">
            <h3 style="margin:0 0 4px;font-size:20px;">${product.name}</h3>
            <p style="margin:0 0 12px;color:var(--muted);font-size:14px;">${product.description}</p>
            <div class="product-price">${product.price}</div>
          </div>
        </div>
        <div class="product-features">
          <ul style="margin:0;padding-left:20px;color:var(--muted);font-size:14px;line-height:1.8;">
            ${featuresList}
          </ul>
        </div>
        <div class="product-actions">
          <a href="/contact/" class="btn primary" style="width:100%;">Add Product →</a>
        </div>
      </div>
    `;
  }).join('');
}

// Render billing tab content (detailed billing)
function renderBillingTabContent(clientData) {
  // Render current bill
  renderCurrentBill(clientData);
  
  // Render billing history
  renderBillingHistory(clientData);
  
  // Render payment information
  renderPaymentInfo(clientData);
}

// Render current bill details
function renderCurrentBill(clientData) {
  const container = document.getElementById('billing-current-bill');
  if (!container || !clientData.billing || !clientData.plan) return;
  
  const billing = clientData.billing;
  const plan = clientData.plan;
  const usage = clientData.usage || { currentMonth: 0 };
  const usagePercent = ((usage.currentMonth / plan.monthlyLimit) * 100).toFixed(1);
  const isOverLimit = usage.currentMonth > plan.monthlyLimit;
  const remainingMessages = Math.max(0, plan.monthlyLimit - usage.currentMonth);
  
  container.innerHTML = `
    <div class="billing-detail-card">
      <div class="billing-detail-grid">
        <div class="billing-detail-section">
          <h3 style="margin:0 0 16px;font-size:20px;">Plan Details</h3>
          <div class="billing-detail-row">
            <span class="billing-detail-label">Plan Name:</span>
            <span class="billing-detail-value">${plan.name}</span>
          </div>
          <div class="billing-detail-row">
            <span class="billing-detail-label">Monthly Limit:</span>
            <span class="billing-detail-value">${plan.monthlyLimit.toLocaleString()} messages</span>
          </div>
          <div class="billing-detail-row">
            <span class="billing-detail-label">Base Price:</span>
            <span class="billing-detail-value">$${plan.price.toFixed(2)}/month</span>
          </div>
          <div class="billing-detail-row">
            <span class="billing-detail-label">Overage Rate:</span>
            <span class="billing-detail-value">$${plan.overageRate.toFixed(2)} per message</span>
          </div>
        </div>
        
        <div class="billing-detail-section">
          <h3 style="margin:0 0 16px;font-size:20px;">Current Usage</h3>
          <div class="billing-detail-row">
            <span class="billing-detail-label">Messages Used:</span>
            <span class="billing-detail-value ${isOverLimit ? 'over-limit' : ''}">
              ${usage.currentMonth.toLocaleString()} / ${plan.monthlyLimit.toLocaleString()} (${usagePercent}%)
            </span>
          </div>
          <div class="billing-detail-row">
            <span class="billing-detail-label">Remaining:</span>
            <span class="billing-detail-value">${remainingMessages.toLocaleString()} messages</span>
          </div>
          ${isOverLimit ? `
            <div class="billing-detail-row">
              <span class="billing-detail-label">Overage Messages:</span>
              <span class="billing-detail-value over-limit">${billing.overageMessages.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="billing-detail-row">
            <span class="billing-detail-label">Next Billing Date:</span>
            <span class="billing-detail-value">${new Date(billing.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
      
      <div class="billing-breakdown-section">
        <h3 style="margin:0 0 16px;font-size:20px;">Current Bill Breakdown</h3>
        <div class="billing-breakdown">
          <div class="billing-line">
            <span>Base Plan (${plan.name})</span>
            <span>$${billing.basePrice.toFixed(2)}</span>
          </div>
          ${isOverLimit ? `
            <div class="billing-line">
              <span>Overage (${billing.overageMessages.toLocaleString()} messages × $${plan.overageRate.toFixed(2)})</span>
              <span class="overage-cost">$${billing.overageCost.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="billing-line billing-total">
            <span><strong>Total Due</strong></span>
            <span><strong>$${billing.currentBill.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render billing history
function renderBillingHistory(clientData) {
  const container = document.getElementById('billing-history');
  if (!container || !clientData.billing) return;
  
  const history = clientData.billing.billingHistory || [];
  
  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <h3 style="margin:16px 0 8px;font-size:20px;">No Billing History</h3>
        <p style="margin:0;color:var(--muted);">Your billing history will appear here once you have invoices.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="billing-history-table">
      <table class="billing-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Invoice #</th>
            <th>Base Plan</th>
            <th>Overage</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${history.map(invoice => `
            <tr>
              <td>${new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td><code style="background:rgba(124,58,237,.1);padding:4px 8px;border-radius:4px;font-size:12px;">${invoice.id}</code></td>
              <td>$${invoice.basePrice.toFixed(2)}</td>
              <td>${invoice.overageCost > 0 ? `$${invoice.overageCost.toFixed(2)}` : '-'}</td>
              <td><strong>$${invoice.amount.toFixed(2)}</strong></td>
              <td><span class="status-badge ${invoice.status}">${invoice.status === 'paid' ? 'Paid' : invoice.status === 'pending' ? 'Pending' : 'Failed'}</span></td>
              <td><a href="${invoice.invoiceUrl}" class="invoice-link">View →</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Render payment information
function renderPaymentInfo(clientData) {
  const container = document.getElementById('payment-info');
  if (!container || !clientData.billing) return;
  
  const paymentMethod = clientData.billing.paymentMethod || {};
  const billingAddress = clientData.billing.billingAddress || {};
  
  container.innerHTML = `
    <div class="payment-info-container">
      <div class="payment-method-section">
        <h3 style="margin:0 0 20px;font-size:20px;">Payment Method</h3>
        <div class="current-payment-method">
          <div class="payment-method-card">
            <div class="payment-method-icon">💳</div>
            <div class="payment-method-details">
              <div class="payment-method-brand">${paymentMethod.brand || 'Card'} •••• ${paymentMethod.last4 || '0000'}</div>
              <div class="payment-method-name">${paymentMethod.name || 'Cardholder Name'}</div>
              <div class="payment-method-expiry">Expires ${String(paymentMethod.expiryMonth || 12).padStart(2, '0')}/${paymentMethod.expiryYear || new Date().getFullYear()}</div>
            </div>
          </div>
          <button class="btn" onclick="showPaymentForm()" style="margin-top:16px;">Update Payment Method</button>
        </div>
        
        <div class="payment-form" id="payment-form" style="display:none;margin-top:24px;">
          <form id="updatePaymentForm" onsubmit="updatePaymentMethod(event)">
            <div class="form-group">
              <label for="card-number">Card Number <span class="required">*</span></label>
              <input type="text" id="card-number" name="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="expiry-month">Expiry Month <span class="required">*</span></label>
                <select id="expiry-month" name="expiryMonth" required>
                  ${Array.from({length: 12}, (_, i) => `<option value="${i + 1}">${String(i + 1).padStart(2, '0')}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="expiry-year">Expiry Year <span class="required">*</span></label>
                <select id="expiry-year" name="expiryYear" required>
                  ${Array.from({length: 10}, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return `<option value="${year}">${year}</option>`;
                  }).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="cvv">CVV <span class="required">*</span></label>
                <input type="text" id="cvv" name="cvv" placeholder="123" maxlength="4" required>
              </div>
            </div>
            <div class="form-group">
              <label for="card-name">Cardholder Name <span class="required">*</span></label>
              <input type="text" id="card-name" name="cardName" placeholder="John Doe" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn primary">Save Payment Method</button>
              <button type="button" class="btn" onclick="hidePaymentForm()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="billing-address-section">
        <h3 style="margin:0 0 20px;font-size:20px;">Billing Address</h3>
        <div class="current-billing-address">
          <div class="billing-address-display">
            ${billingAddress.line1 ? `
              <p style="margin:0 0 4px;">${billingAddress.line1}</p>
              ${billingAddress.line2 ? `<p style="margin:0 0 4px;">${billingAddress.line2}</p>` : ''}
              <p style="margin:0 0 4px;">${billingAddress.city}, ${billingAddress.state} ${billingAddress.zip}</p>
              <p style="margin:0;">${billingAddress.country}</p>
            ` : '<p style="margin:0;color:var(--muted);">No billing address on file</p>'}
          </div>
          <button class="btn" onclick="showAddressForm()" style="margin-top:16px;">Update Billing Address</button>
        </div>
        
        <div class="address-form" id="address-form" style="display:none;margin-top:24px;">
          <form id="updateAddressForm" onsubmit="updateBillingAddress(event)">
            <div class="form-group">
              <label for="address-line1">Address Line 1 <span class="required">*</span></label>
              <input type="text" id="address-line1" name="line1" placeholder="123 Main St" value="${billingAddress.line1 || ''}" required>
            </div>
            <div class="form-group">
              <label for="address-line2">Address Line 2</label>
              <input type="text" id="address-line2" name="line2" placeholder="Suite 100" value="${billingAddress.line2 || ''}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="address-city">City <span class="required">*</span></label>
                <input type="text" id="address-city" name="city" placeholder="New York" value="${billingAddress.city || ''}" required>
              </div>
              <div class="form-group">
                <label for="address-state">State <span class="required">*</span></label>
                <input type="text" id="address-state" name="state" placeholder="NY" value="${billingAddress.state || ''}" required>
              </div>
              <div class="form-group">
                <label for="address-zip">ZIP Code <span class="required">*</span></label>
                <input type="text" id="address-zip" name="zip" placeholder="10001" value="${billingAddress.zip || ''}" required>
              </div>
            </div>
            <div class="form-group">
              <label for="address-country">Country <span class="required">*</span></label>
              <input type="text" id="address-country" name="country" placeholder="United States" value="${billingAddress.country || 'United States'}" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn primary">Save Address</button>
              <button type="button" class="btn" onclick="hideAddressForm()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Payment form functions
function showPaymentForm() {
  const form = document.getElementById('payment-form');
  if (form) form.style.display = 'block';
}

function hidePaymentForm() {
  const form = document.getElementById('payment-form');
  if (form) form.style.display = 'none';
  const updateForm = document.getElementById('updatePaymentForm');
  if (updateForm) updateForm.reset();
}

function showAddressForm() {
  const form = document.getElementById('address-form');
  if (form) form.style.display = 'block';
}

function hideAddressForm() {
  const form = document.getElementById('address-form');
  if (form) form.style.display = 'none';
  const updateForm = document.getElementById('updateAddressForm');
  if (updateForm) updateForm.reset();
}

function updatePaymentMethod(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const cardNumber = formData.get('cardNumber').replace(/\s/g, '');
  const last4 = cardNumber.slice(-4);
  
  // In production, this would make an API call
  alert(`Payment method updated successfully!\nCard ending in ${last4} has been saved.`);
  hidePaymentForm();
  
  // Reload the payment info section
  const clientData = Auth.getClientData(Auth.getSession().clientId);
  if (clientData.billing && clientData.billing.paymentMethod) {
    clientData.billing.paymentMethod.last4 = last4;
    clientData.billing.paymentMethod.expiryMonth = parseInt(formData.get('expiryMonth'));
    clientData.billing.paymentMethod.expiryYear = parseInt(formData.get('expiryYear'));
    clientData.billing.paymentMethod.name = formData.get('cardName');
  }
  renderPaymentInfo(clientData);
}

function updateBillingAddress(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  
  // In production, this would make an API call
  alert('Billing address updated successfully!');
  hideAddressForm();
  
  // Reload the payment info section
  const clientData = Auth.getClientData(Auth.getSession().clientId);
  if (clientData.billing && !clientData.billing.billingAddress) {
    clientData.billing.billingAddress = {};
  }
  if (clientData.billing && clientData.billing.billingAddress) {
    clientData.billing.billingAddress.line1 = formData.get('line1');
    clientData.billing.billingAddress.line2 = formData.get('line2');
    clientData.billing.billingAddress.city = formData.get('city');
    clientData.billing.billingAddress.state = formData.get('state');
    clientData.billing.billingAddress.zip = formData.get('zip');
    clientData.billing.billingAddress.country = formData.get('country');
  }
  renderPaymentInfo(clientData);
}

// Render billing information
function renderBilling(clientData) {
  const container = document.getElementById('billing-container');
  if (!container || !clientData.billing || !clientData.plan) return;
  
  const billing = clientData.billing;
  const plan = clientData.plan;
  const usage = clientData.usage;
  const isOverLimit = usage.currentMonth > plan.monthlyLimit;
  const remainingMessages = Math.max(0, plan.monthlyLimit - usage.currentMonth);
  
  container.innerHTML = `
    <div class="billing-overview">
      <div class="billing-plan-card">
        <h3 style="margin:0 0 8px;font-size:20px;">Current Plan</h3>
        <div class="plan-name">${plan.name}</div>
        <div class="plan-price">$${plan.price.toFixed(2)}<span class="plan-period">/month</span></div>
        <div class="plan-limit">${plan.monthlyLimit.toLocaleString()} messages/month</div>
      </div>
      
      <div class="billing-usage-card">
        <h3 style="margin:0 0 16px;font-size:20px;">Current Usage</h3>
        <div class="usage-meter">
          <div class="usage-meter-bar">
            <div class="usage-meter-fill" style="width:${Math.min((usage.currentMonth / plan.monthlyLimit) * 100, 100)}%"></div>
          </div>
          <div class="usage-meter-labels">
            <span>${usage.currentMonth.toLocaleString()} / ${plan.monthlyLimit.toLocaleString()} messages</span>
            ${isOverLimit ? `<span class="over-limit-badge">⚠️ Over Limit</span>` : `<span>${remainingMessages.toLocaleString()} remaining</span>`}
          </div>
        </div>
        ${isOverLimit ? `
          <div class="overage-warning">
            <strong>⚠️ You are over your monthly limit!</strong>
            <p>You've used ${(usage.currentMonth - plan.monthlyLimit).toLocaleString()} extra messages this month.</p>
          </div>
        ` : ''}
      </div>
    </div>
    
    <div class="billing-details">
      <h3 style="margin:0 0 16px;font-size:20px;">Current Bill</h3>
      <div class="billing-breakdown">
        <div class="billing-line">
          <span>Base Plan (${plan.name})</span>
          <span>$${billing.basePrice.toFixed(2)}</span>
        </div>
        ${isOverLimit ? `
          <div class="billing-line">
            <span>Overage (${billing.overageMessages.toLocaleString()} messages × $${plan.overageRate.toFixed(2)})</span>
            <span class="overage-cost">$${billing.overageCost.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="billing-line billing-total">
          <span><strong>Total Due</strong></span>
          <span><strong>$${billing.currentBill.toFixed(2)}</strong></span>
        </div>
      </div>
      <div class="billing-next-date">
        <p style="margin:16px 0 0;color:var(--muted);">
          Next billing date: <strong>${new Date(billing.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </p>
      </div>
    </div>
  `;
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    if (window.location.pathname.includes('/dashboard/')) {
      initDashboard();
    }
  });
} else {
  updateNavigation();
  if (window.location.pathname.includes('/dashboard/')) {
    initDashboard();
  }
}
