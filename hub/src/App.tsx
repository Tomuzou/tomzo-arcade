import { useEffect, useState } from 'react';
import { GAMES } from './games';
import './App.css';

/** Chrome / Edge がインストール可能なときに渡してくるイベント（標準の型定義に無いので最小限を定義） */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const BASE = import.meta.env.BASE_URL;

export default function App() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    await installEvent?.prompt();
    setInstallEvent(null);
  };

  return (
    <div className="arcade">
      <header className="top">
        <div className="logo">
          <img className="logo-mark" src={`${BASE}icons/icon.svg`} alt="" />
          <span>
            TOMZO <b>ARCADE</b>
          </span>
        </div>
        {installEvent && (
          <button className="install" onClick={install}>
            ⬇ アプリとしてインストール
          </button>
        )}
      </header>

      <section className="intro">
        <p className="eyebrow">INSERT COIN — FREE PLAY</p>
        <h1>
          すぐ遊べる、
          <br />
          <span>ミニゲーム集。</span>
        </h1>
        <p className="lead">ブラウザでそのまま。インストールすればアプリのように起動できます。</p>
      </section>

      <main className="games">
        {GAMES.map((game) => (
          <article key={game.id} className="card" style={{ '--accent': game.accent } as React.CSSProperties}>
            <a className="thumb" href={`${BASE}${game.path}`} aria-label={`${game.title}で遊ぶ`}>
              <img src={`${BASE}${game.thumb}`} alt="" loading="lazy" />
              <span className="play-badge">▶ PLAY</span>
            </a>
            <div className="card-body">
              <div className="tags">
                {game.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <h2>{game.title}</h2>
              <p className="tagline">{game.tagline}</p>
              <p className="desc">{game.description}</p>
              <a className="play" href={`${BASE}${game.path}`}>
                遊ぶ
              </a>
              {game.versions && (
                <details className="versions">
                  <summary>過去のバージョン（{game.versions.length}）</summary>
                  <ul>
                    {game.versions.map((v) => (
                      <li key={v.path}>
                        <a href={`${BASE}${v.path}`}>
                          {v.label}
                          <small>{v.note}</small>
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </article>
        ))}
        <article className="card soon" aria-label="次のゲームは準備中">
          <div className="soon-inner">
            <span className="soon-icon">?</span>
            <h2>NEXT GAME</h2>
            <p>準備中</p>
          </div>
        </article>
      </main>

      <footer className="foot">© TOMZO ARCADE</footer>
    </div>
  );
}
