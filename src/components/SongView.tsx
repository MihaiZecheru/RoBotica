import { useNavigate, useParams } from "react-router-dom";
import TSong from "../database/TSong";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import Database from "../database/Database";
import { SongID } from "../database/ID";
import { useEffect, useState } from "react";
import { Button, Divider, Paper } from "@mui/material";
import ClickableLyric from "./ClickableLyric";
import ClickableWord from "./ClickableWord";

function create_embed(video_id: string, frame_title: string) {
  return <iframe
    width="400"
    height="225"
    src={`https://www.youtube.com/embed/${video_id}`}
    title={frame_title}
    frameBorder={0}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen={false}>
  </iframe>
}

const SongView = (_: AuthenticatedComponentDefaultProps) => {
  const { id } = useParams();
  const [song, setSong] = useState<TSong | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Database.GetSong(id as SongID).then((_song: TSong) => {
      setSong(_song);
      setLoading(false);
    });
  }, [id]);

  if (loading || !song) {
    return (<></>);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
      <Paper elevation={3} style={{ padding: 20, height: '80vh', maxHeight: '80vh', width: '90vw', overflowY: 'hidden', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '2rem' }}>
          <h2>{song.title} - {song.artist}</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', maxHeight: '100%' }}>
          <div style={{ padding: '20px', paddingTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50%' }}>
            { create_embed(song.youtube_video_id, `${song.title} by ${song.artist}`) }
          </div>
          <Paper
            elevation={1}
            style={{ padding: '20px', overflowY: 'auto', marginTop: '20px', marginBottom: '20px', width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="hide-scrollbar-y">
            <p style={{ height: '100%' }}>
              {
                song.lyrics.split("\n").map((lyric, index) => (
                  <div>
                    {
                      lyric.split(" ").map((word, index) => (
                        <ClickableWord key={index} word={word} language={song.language} />
                      ))
                    }
                    {
                      lyric == "" && <br />
                    }
                    {
                      /* Do not make a clickable lyric for the "[refren]" indicators that show what part of the song it is */
                      !lyric.startsWith("[") && !lyric.endsWith("]") && lyric !== "" &&
                      <ClickableLyric key={index} language={song.language} lyric={lyric} song={song} />
                    }
                  </div>
                ))
              }
            </p>
          </Paper>
        </div>
      </Paper>
      <Button onClick={() => navigate('/navily')} style={{ position: 'absolute', bottom: '.5rem', right: '.5rem' }}>Navily</Button>
    </div>
  );
}
 
export default SongView;