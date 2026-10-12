/**
 * アーケードに並べるゲームの一覧。新しいゲームは games/<id>/ を作り、ここに1件足す。
 * path・versions[].path はハブ（BASE_URL）からの相対パス。
 */
export interface GameVersion {
  label: string;
  path: string;
  note: string;
}

export interface GameEntry {
  id: string;
  title: string;
  tagline: string;
  description: string;
  /** ハブの public/thumbs/ 内のサムネイル */
  thumb: string;
  path: string;
  tags: string[];
  /** カードのアクセント色 */
  accent: string;
  /** 遊べる過去バージョン（新しい順） */
  versions?: GameVersion[];
}

export const GAMES: GameEntry[] = [
  {
    id: 'free-kick',
    title: 'FREE KICK LAB',
    tagline: '狙う、曲げる、風を読む。',
    description: '壁とキーパーを越える3Dフリーキック。40ステージ、10球ラッシュ、球質を変えるアイテム。',
    thumb: 'thumbs/free-kick.jpg',
    path: 'free-kick/',
    tags: ['3D', 'スポーツ', '物理'],
    accent: '#c6f36b',
    versions: [
      { label: 'ver.c.4', path: 'free-kick/ver.c.4/', note: 'Claude版・スキルボール' },
      { label: 'ver.c.3', path: 'free-kick/ver.c.3/', note: 'リアル物理・風' },
      { label: 'ver.c.2', path: 'free-kick/ver.c.2/', note: '球数制限' },
      { label: 'ver.c.1', path: 'free-kick/ver.c.1/', note: '初期版' },
    ],
  },
];
