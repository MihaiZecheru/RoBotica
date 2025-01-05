import { SongID } from "./ID";
import TLanguage from "./TLanguage";

interface TSong {
  id: SongID;
  language: TLanguage;
  title: string;
  artist: string;
  year: number | null;
  lyrics: string;
  thumbnail_url: string;
  image_url: string;
  youtube_video_id: string;
}

export default TSong;