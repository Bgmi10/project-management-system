import { PagePreview, FormData } from '../types';

interface SchemaMarkup {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  address: {
    "@type": string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  geo?: {
    "@type": string;
    latitude: string;
    longitude: string;
  };
}

export function generateLandingPage(preview: PagePreview, formData: FormData): string {
  const { title, url, location } = preview;
  const { business, images, logoUrl } = formData;
  
  // Generate description from business details
  const description = business.description || `Find the best ${title}. Professional services tailored to your needs in ${location.city}, ${location.state}.`;
  
  // Enhanced service card generation with unique icons
  const serviceCards = business.services
    .split('\n')
    .filter(service => service.trim())
    .map((service, index) => {
      const icons = [
        '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline>',
        '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>',
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>',
        '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
        '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>',
        '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>'
      ];

      return `
        <div class="service-card transform hover:scale-105 transition-transform duration-300">
          <div class="bg-white rounded-lg p-8 h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div class="icon-wrapper mb-6">
              <div class="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  ${icons[index % icons.length]}
                </svg>
              </div>
            </div>
            <h3 class="text-xl font-semibold mb-4 text-gray-900">${service}</h3>
            <div class="mt-4 flex-grow">
              <ul class="space-y-2">
                ${generateServiceFeatures(service)}
              </ul>
            </div>
            <div class="mt-6">
              <a href="#contact" class="inline-flex items-center text-primary hover:text-primary-hover font-medium transition-colors duration-200">
                Learn More
                <svg class="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Helper function to generate service features
  function generateServiceFeatures(service: string): string {
    const features = {
      'Vitrectomy Recovery Chair Rental': [
        'Ergonomic Design',
        'Adjustable Positioning',
        'Memory Foam Padding',
        'Easy Assembly'
      ],
      'Face-Down Support Cushions & Pillows': [
        'Pressure Relief',
        'Cooling Technology',
        'Washable Covers',
        'Portable Design'
      ],
      'Adjustable Face-Down Mirrors': [
        'HD Clarity',
        'Flexible Mounting',
        'Anti-Fog Coating',
        'LED Illumination'
      ],
      'Complete Recovery Kits': [
        'All Essential Items',
        'Setup Guide',
        'Support Materials',
        'Care Instructions'
      ],
      'Delivery & Setup Support': [
        'Same-Day Available',
        'Professional Installation',
        'Safety Verification',
        'Usage Training'
      ],
      'Nationwide Rental Service': [
        'Flexible Duration',
        'Insurance Accepted',
        'Express Shipping',
        'Easy Returns'
      ]
    };

    const serviceFeatures = features[service as keyof typeof features] || [
      'Professional Service',
      'Expert Support',
      '24/7 Assistance',
      'Quality Guaranteed'
    ];

    return serviceFeatures
      .map(feature => `
        <li class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span class="text-gray-600">${feature}</span>
        </li>
      `)
      .join('');
  }

  const schema: SchemaMarkup = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: title,
    description,
    url: `https://${url}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: location.city,
      addressRegion: location.state,
      addressCountry: "US"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString()
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Professional Services</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://${url}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="https://${url}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="${images.hero}">
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${images.hero}">
    
    <style>
      :root {
        --primary: #A8E6CF;
        --primary-hover: #81C8B6;
        --secondary: #D4F8E8;
        --accent: #F7E9D7;
        --text-heading: #4A4A4A;
        --text-body: #6D6D6D;
        --background: #FFFFFF;
        --spacing-base: 24px;
        --radius: 8px;
        --shadow-sm: 0px 4px 12px rgba(0, 0, 0, 0.1);
        --shadow-lg: 0px 8px 24px rgba(0, 0, 0, 0.15);
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Poppins', sans-serif;
        color: var(--text-body);
        font-size: 18px;
        line-height: 1.6;
        background: var(--background);
      }
      
      h1, h2, h3, h4, h5, h6 {
        color: var(--text-heading);
        line-height: 1.2;
        margin-bottom: var(--spacing-base);
      }
      
      h1 { font-size: 48px; font-weight: 700; }
      h2 { font-size: 32px; font-weight: 600; }
      h3 { font-size: 24px; font-weight: 500; }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 var(--spacing-base);
      }
      
      section {
        padding: calc(var(--spacing-base) * 3) 0;
      }

      /* Navigation */
      .nav {
        background: var(--background);
        border-bottom: 1px solid var(--secondary);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        padding: calc(var(--spacing-base) * 0.5) 0;
      }
      
      .nav-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .nav-menu {
        display: flex;
        gap: var(--spacing-base);
        list-style: none;
      }
      
      .nav-link {
        color: var(--text-body);
        text-decoration: none;
        font-weight: 500;
        padding: calc(var(--spacing-base) * 0.25) calc(var(--spacing-base) * 0.5);
        border-radius: var(--radius);
        transition: all 0.3s ease;
      }
      
      .nav-link:hover {
        color: var(--primary);
        background: var(--secondary);
      }

      /* Hero Section */
      .hero {
        background: linear-gradient(135deg, var(--secondary), var(--primary));
        min-height: 100vh;
        display: flex;
        align-items: center;
        padding-top: 80px;
      }
      
      .hero-content {
        max-width: 50%;
      }

      /* Contact Form */
      .contact-form {
        background: var(--background);
        padding: calc(var(--spacing-base) * 2);
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        max-width: 500px;
        width: 100%;
      }
      
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-base);
      }
      
      .form-group.full-width {
        grid-column: span 2;
      }
      
      .form-label {
        display: block;
        margin-bottom: calc(var(--spacing-base) * 0.25);
        color: var(--text-heading);
        font-weight: 500;
      }
      
      .form-input,
      .form-select,
      .form-textarea {
        width: 100%;
        padding: calc(var(--spacing-base) * 0.5);
        border: 1px solid var(--primary);
        border-radius: var(--radius);
        font-family: 'Poppins', sans-serif;
      }
      
      .form-button {
        background: var(--primary);
        color: var(--text-heading);
        border: none;
        padding: calc(var(--spacing-base) * 0.5) var(--spacing-base);
        border-radius: var(--radius);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
      }
      
      .form-button:hover {
        background: var(--primary-hover);
        transform: translateY(-2px);
      }

      /* Service Cards */
      .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: calc(var(--spacing-base) * 2);
        margin-top: calc(var(--spacing-base) * 2);
      }
      
      .service-card {
        background: var(--background);
        border-radius: var(--radius);
        padding: calc(var(--spacing-base) * 2);
        box-shadow: var(--shadow-sm);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .service-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      /* Features Grid */
      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: calc(var(--spacing-base) * 2);
        margin-top: calc(var(--spacing-base) * 2);
      }

      /* About Section */
      .about-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: calc(var(--spacing-base) * 2);
        align-items: start;
      }

      .about-image img {
        width: 100%;
        height: auto;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        :root {
          --spacing-base: 16px;
        }
        
        h1 { font-size: 36px; }
        h2 { font-size: 28px; }
        h3 { font-size: 20px; }
        
        .nav-menu {
          display: none;
        }
        
        .hero-content {
          max-width: 100%;
        }
        
        .form-grid {
          grid-template-columns: 1fr;
        }
        
        .about-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="nav">
      <div class="container nav-container">
        <a href="#" class="nav-logo">
          <img src="${logoUrl}" alt="${title}" style="height: 40px; width: auto;" />
        </a>
        <ul class="nav-menu">
          <li><a href="#services" class="nav-link">Services</a></li>
          <li><a href="#features" class="nav-link">Benefits</a></li>
          <li><a href="#about" class="nav-link">About</a></li>
          <li><a href="#contact" class="nav-link">Contact</a></li>
        </ul>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero" id="home">
      <div class="container">
        <div class="flex items-center gap-8">
          <div class="hero-content">
            <h1>${title}</h1>
            <p class="text-lg mb-8">${business.uniqueValue.split('\n')[0]}</p>
          </div>
          
          <!-- Contact Form -->
          <div class="contact-form" id="contact">
            <h2 class="text-2xl font-bold mb-6">Get Started Today</h2>
            <form class="space-y-6">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input type="text" class="form-input" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone *</label>
                  <input type="tel" class="form-input" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" placeholder="123-456-7890" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-input" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Service Needed</label>
                  <select class="form-select">
                    ${business.services.split('\n')
                      .map(service => `<option value="${service.toLowerCase().replace(/\s+/g, '-')}">${service}</option>`)
                      .join('')}
                  </select>
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Message</label>
                  <textarea class="form-textarea" rows="4"></textarea>
                </div>
              </div>
              <button type="submit" class="form-button">Request Information</button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="bg-gradient-to-b from-white to-secondary/10">
      <div class="container">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h2>Our Services</h2>
          <p class="text-lg">
            Comprehensive recovery solutions tailored to your needs. Experience comfort and support
            throughout your healing journey.
          </p>
        </div>
        <div class="services-grid">
          ${serviceCards}
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features">
      <div class="container">
        <h2 class="text-center">Key Benefits</h2>
        <div class="features-grid">
          <div class="service-card text-center">
            <img src="${images.feature1}" alt="Quality Equipment" class="w-16 h-16 mx-auto mb-4" />
            <h3>Quality Equipment</h3>
            <p>Premium recovery equipment designed for optimal healing and comfort.</p>
          </div>
          <div class="service-card text-center">
            <img src="${images.feature2}" alt="Expert Support" class="w-16 h-16 mx-auto mb-4" />
            <h3>Expert Support</h3>
            <p>24/7 assistance from our experienced medical equipment specialists.</p>
          </div>
          <div class="service-card text-center">
            <img src="${images.feature3}" alt="Nationwide Service" class="w-16 h-16 mx-auto mb-4" />
            <h3>Nationwide Service</h3>
            <p>Convenient delivery and setup anywhere in the country.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="bg-gradient-to-b from-secondary/10 to-white">
      <div class="container">
        <div class="about-grid">
          <div class="about-content">
            <h2>About Us</h2>
            <p class="mb-8">${business.description}</p>
            <h3>Our Values</h3>
            <ul class="space-y-4">
              ${business.coreValues
                .split('\n')
                .filter(value => value.trim())
                .map(value => `
                  <li class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>${value.trim()}</span>
                  </li>
                `).join('')}
            </ul>
          </div>
          <div class="about-image">
            <img src="${images.hero}" alt="About Us" />
          </div>
        </div>
      </div>
    </section>

    <script type="application/ld+json">
      ${JSON.stringify(schema)}
    </script>
    
    <script>
      // Navigation
      const nav = document.querySelector('.nav');
      window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      });
      
      // Smooth scroll
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        });
      });
      
      // Form handling
      const form = document.querySelector('form');
      const phoneInput = document.querySelector('input[type="tel"]');
      
      phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 10) {
          value = value.match(/(\d{3})(\d{3})(\d{4})/);
          e.target.value = value[1] + '-' + value[2] + '-' + value[3];
        }
      });
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your interest! We will contact you shortly.');
        form.reset();
      });
    </script>
</body>
</html>`;
}

export function generateManifest(previews: PagePreview[]): string {
  const manifest = previews.map(preview => ({
    url: preview.url,
    title: preview.title,
    location: {
      city: preview.location.city,
      state: preview.location.state,
      distance: preview.location.distance,
      coordinates: {
        latitude: preview.location.latitude,
        longitude: preview.location.longitude
      }
    }
  }));

  return JSON.stringify(manifest, null, 2);
}