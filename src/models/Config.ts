import mongoose from 'mongoose';

const VisualElement = {
  text: String,
  color: { type: String, default: '#0F0F0F' },
  fontSize: { type: String, default: '14px' },
  fontFamily: { type: String, default: 'Inter' },
  link: String,
  bgColor: String,
  isVisible: { type: Boolean, default: true }
};

const ConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'global' },
  
  // Point #3: Announcement Bar
  announcementBar: {
    mainText: VisualElement,
    socialIcons: [{ icon: String, link: String }]
  },
  
  // Point #4: Header
  header: {
    logoText: VisualElement,
    trendingSearches: [String],
    trendingProducts: [String]
  },
  
  // Point #5: Hero Section
  hero: {
    slides: [{
      image: String,
      title: VisualElement,
      subtitle: VisualElement,
      button: VisualElement
    }]
  },
  
  // Point #10: Footer
  footer: {
    description: VisualElement,
    copyright: VisualElement,
    links: [{ label: String, url: String }]
  }
}, { timestamps: true });

export default mongoose.model('Config', ConfigSchema);