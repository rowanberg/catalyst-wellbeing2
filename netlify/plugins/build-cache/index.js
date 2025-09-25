module.exports = {
  onPreBuild: async ({ utils }) => {
    console.log('🔧 Netlify Build Cache Plugin: Starting pre-build optimization...');
    
    // Restore Next.js cache if available
    const success = await utils.cache.restore('.next/cache');
    if (success) {
      console.log('✅ Restored Next.js build cache');
    } else {
      console.log('ℹ️  No previous Next.js cache found');
    }
  },
  
  onPostBuild: async ({ utils }) => {
    console.log('💾 Netlify Build Cache Plugin: Saving build cache...');
    
    // Save Next.js cache for future builds
    const success = await utils.cache.save('.next/cache');
    if (success) {
      console.log('✅ Saved Next.js build cache for future builds');
    } else {
      console.log('⚠️  Failed to save Next.js cache');
    }
  }
};
