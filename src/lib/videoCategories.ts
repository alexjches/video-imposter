export interface VideoItem {
  id: string;
  name: string;
  crewmateVideoUrl: string;
  imposterVideoUrl: string;
}

export interface VideoCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: VideoItem[];
}

export const VIDEO_CATEGORIES: Record<string, VideoCategory> = {
  memes: {
    id: 'memes',
    name: 'Memes',
    icon: '😂',
    description: 'Viral clips and funny moments',
    items: [
      {
        id: 'meme_1',
        name: 'Rick Roll vs Trololo',
        crewmateVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        imposterVideoUrl: 'https://www.youtube.com/watch?v=2Z4m4lnjxkY',
      },
      {
        id: 'meme_2',
        name: 'Numa Numa vs Keyboard Cat',
        crewmateVideoUrl: 'https://www.youtube.com/watch?v=KmtzQCSh6xk',
        imposterVideoUrl: 'https://www.youtube.com/watch?v=J---aiyznGQ',
      }
    ],
  },
  sports: {
    id: 'sports',
    name: 'Sports',
    icon: '🏆',
    description: 'Iconic sporting moments',
    items: [
      {
        id: 'sport_1',
        name: 'Messi Goal vs Ronaldo Goal',
        crewmateVideoUrl: 'https://www.youtube.com/watch?v=PSanjqYOM_4',
        imposterVideoUrl: 'https://www.youtube.com/watch?v=sB1o1vO383g',
      },
      {
        id: 'sport_2',
        name: 'Buzzer Beater vs Strikeout',
        crewmateVideoUrl: 'https://www.youtube.com/watch?v=v2bEYOE_GJU',
        imposterVideoUrl: 'https://www.youtube.com/watch?v=f7n6rOof-4Y',
      }
    ],
  },
  music: {
    id: 'music',
    name: 'Music Videos',
    icon: '🎵',
    description: 'Hit songs and music clips',
    items: [
      {
        id: 'music_1',
        name: 'Thriller vs Billie Jean',
        crewmateVideoUrl: 'https://www.youtube.com/watch?v=sOnqjkJTMaA',
        imposterVideoUrl: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y',
      },
      {
        id: 'music_2',
        name: 'Bohemian Rhapsody vs We Will Rock You',
        crewmateVideoUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
        imposterVideoUrl: 'https://www.youtube.com/watch?v=-tJYN-eG1zk',
      }
    ],
  }
};

export function getRandomVideoPair(categoryId: string): VideoItem | null {
  const category = VIDEO_CATEGORIES[categoryId];
  if (!category || category.items.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * category.items.length);
  return category.items[randomIndex];
}
