const randomPrompts = [
    "A majestic dragon flying over a medieval castle at sunset",
    "Futuristic cityscape with neon lights and flying cars",
    "Beautiful underwater coral reef with colorful fish",
    "Abstract art with vibrant colors and geometric shapes",
    "Cosmic nebula with stars and planets in deep space",
    "Magical forest with glowing mushrooms and fairy lights",
    "Steampunk robot in a Victorian era workshop",
    "Serene Japanese garden with cherry blossoms",
    "Cyberpunk street scene with rain and neon signs",
    "Fantasy wizard casting a spell in an ancient library"
];

const modelMap = {
    'flux': 'flux',
    'flux-schnell': 'flux-schnell',
    'stable-diffusion-xl': 'stable-diffusion-xl',
    'stable-diffusion': 'stable-diffusion',
    'openjourney': 'openjourney'
};

const ratioMap = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 }
};

const promptForm = document.querySelector('.prompt-form');
const promptInput = document.querySelector('.prompt-input');
const promptBtn = document.querySelector('.prompt-btn');
const generateBtn = document.querySelector('.generate-btn');
const galleryGrid = document.getElementById('gallery-grid');
const themeToggle = document.querySelector('.theme-toggle');
const modelSelect = document.getElementById('model-select');
const countSelect = document.getElementById('count-select');
const ratioSelect = document.getElementById('ratio-select');

let isDarkMode = localStorage.getItem('darkMode') === 'true';

function applyTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
});

applyTheme();

promptBtn.addEventListener('click', () => {
    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    promptInput.value = randomPrompt;
    promptInput.focus();
});

async function generateImage(prompt, model, ratio, index) {
    const { width, height } = ratioMap[ratio];
    const modelParam = modelMap[model] || 'flux';
    
    // Generate unique seed for each image to get different variations
    const seed = Math.floor(Math.random() * 1000000000);
    
    // Pollinations.ai free API with seed for unique variations
    const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${modelParam}&seed=${seed}&nologo=true`;
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout. Please try again.'));
        }, 60000);
        
        img.onload = () => {
            clearTimeout(timeout);
            resolve(img.src);
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to generate image. The service might be temporarily unavailable.'));
        };
        
        img.src = apiUrl + '&t=' + Date.now();
    });
}

function createImageCard(imageUrl, index) {
    const card = document.createElement('div');
    card.className = 'img-card';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'result-img';
    img.alt = `Generated image ${index + 1}`;
    
    const overlay = document.createElement('div');
    overlay.className = 'img-overlay';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'img-download-btn';
    downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
    downloadBtn.addEventListener('click', () => downloadImage(imageUrl, index));
    
    overlay.appendChild(downloadBtn);
    card.appendChild(img);
    card.appendChild(overlay);
    
    return card;
}

function createLoadingCard() {
    const card = document.createElement('div');
    card.className = 'img-card loading';
    
    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-container';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    const statusText = document.createElement('p');
    statusText.className = 'status-text';
    statusText.textContent = 'Generating...';
    
    statusContainer.appendChild(spinner);
    statusContainer.appendChild(statusText);
    card.appendChild(statusContainer);
    
    return card;
}

function createErrorCard(message) {
    const card = document.createElement('div');
    card.className = 'img-card error';
    
    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-container';
    
    const errorIcon = document.createElement('i');
    errorIcon.className = 'fa-solid fa-triangle-exclamation';
    
    const statusText = document.createElement('p');
    statusText.className = 'status-text';
    statusText.textContent = message || 'Failed to generate';
    
    statusContainer.appendChild(errorIcon);
    statusContainer.appendChild(statusText);
    card.appendChild(statusContainer);
    
    return card;
}

function downloadImage(imageUrl, index) {
    fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-generated-image-${Date.now()}-${index + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Download failed:', error);
            alert('Failed to download image. Please try again.');
        });
}

promptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prompt = promptInput.value.trim();
    const model = modelSelect.value;
    const count = parseInt(countSelect.value);
    const ratio = ratioSelect.value;
    
    if (!prompt || !model || !count || !ratio) {
        alert('Please fill in all fields');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
    
    galleryGrid.innerHTML = '';
    
    const loadingCards = [];
    for (let i = 0; i < count; i++) {
        const loadingCard = createLoadingCard();
        galleryGrid.appendChild(loadingCard);
        loadingCards.push(loadingCard);
    }
    
    const promises = [];
    for (let i = 0; i < count; i++) {
        promises.push(
            generateImage(prompt, model, ratio, i)
                .then(imageUrl => {
                    if (loadingCards[i] && loadingCards[i].parentNode) {
                        loadingCards[i].remove();
                    }
                    const imageCard = createImageCard(imageUrl, i);
                    galleryGrid.appendChild(imageCard);
                    return imageUrl;
                })
                .catch(error => {
                    console.error(`Error generating image ${i + 1}:`, error);
                    if (loadingCards[i] && loadingCards[i].parentNode) {
                        loadingCards[i].remove();
                    }
                    const errorCard = createErrorCard(error.message || 'Generation failed');
                    galleryGrid.appendChild(errorCard);
                    return null;
                })
        );
    }
    
    try {
        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        const failCount = count - successCount;
        
        if (failCount > 0 && successCount === 0) {
            console.warn('All image generations failed');
        } else if (failCount > 0) {
            console.warn(`${failCount} image(s) failed to generate`);
        }
    } catch (error) {
        console.error('Generation error:', error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fa-solid fa-wand-sparkles"></i> Generate';
    }
});



