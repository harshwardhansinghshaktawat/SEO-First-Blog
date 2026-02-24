// WIDGET CODE - Blog Category Page
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixSeoFrontend from 'wix-seo-frontend';

const CATEGORIES_COLLECTION = '@website-freelancer/seo-first-blog/BlogCategories';

$w.onReady(async function () {
    const pathArray = wixLocation.path;
    const slug = pathArray[pathArray.length - 1];
    
    console.log('Category slug:', slug);
    
    if (!slug || slug === 'category') {
        wixLocation.to('/blog');
        return;
    }

    await loadCategory(slug);
});

async function loadCategory(slug) {
    try {
        console.log('Loading category with slug:', slug);
        
        const results = await wixData.query(CATEGORIES_COLLECTION)
            .eq('slug', slug)
            .include('posts')
            .find();

        console.log('Category query results:', results.items.length);

        if (results.items.length === 0) {
            console.log('No category found for slug:', slug);
            wixLocation.to('/blog');
            return;
        }

        const category = results.items[0];
        console.log('Category loaded:', category.name, 'with', category.posts?.length || 0, 'posts');

        const categoryViewer = $w('#categoryViewer');
        
        categoryViewer.setAttribute('category-data', JSON.stringify(category));
        
        if (category.posts && category.posts.length > 0) {
            const publishedPosts = category.posts.filter(post => post.status === 'published');
            categoryViewer.setAttribute('posts-data', JSON.stringify(publishedPosts));
        } else {
            categoryViewer.setAttribute('posts-data', JSON.stringify([]));
        }

        await updateSEO(category);

    } catch (error) {
        console.error('Error loading category:', error);
        wixLocation.to('/blog');
    }
}

async function updateSEO(category) {
    try {
        const title = `${category.title || category.name} - Blog Category`;
        const description = category.description || `Browse all posts in ${category.name} category`;

        const metaTags = [
            { name: 'description', content: description },
            { name: 'robots', content: 'index, follow' },
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { property: 'og:type', content: 'website' },
            { name: 'twitter:card', content: 'summary' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: description }
        ];

        await wixSeoFrontend.setTitle(title);
        await wixSeoFrontend.setMetaTags(metaTags);

        console.log('SEO updated for category:', category.name);

    } catch (error) {
        console.error('Error updating SEO:', error);
    }
}

$w('#categoryViewer').on('navigate-to-post', (event) => {
    const slug = event.detail.slug;
    console.log('Navigating to post:', slug);
    wixLocation.to(`/blog-post/${slug}`);
});
