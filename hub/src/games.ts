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
    description: '壁とキーパーを越える3Dフリーキック。40ステージ、風、ナックルやブーメランなど球質を変えるスキルボール。',
    thumb: 'thumbs/free-kick.jpg',
    path: 'free-kick/',
    tags: ['3D', 'スポーツ', '物理'],
    accent: '#c6f36b',
    versions: [
      { label: 'ver.4.0.c', path: 'free-kick/ver.4.0.c/', note: 'Claude版・スキルボール' },
      { label: 'ver.3.1.g', path: 'free-kick/ver.3.1.g/', note: 'Codex版・10球ラッシュ' },
      { label: 'ver.3.0.c', path: 'free-kick/ver.3.0.c/', note: 'リアル物理・風' },
      { label: 'ver.2.0.c', path: 'free-kick/ver.2.0.c/', note: '球数制限' },
      { label: 'ver.1.0.c', path: 'free-kick/ver.1.0.c/', note: '初期版' },
    ],
  },
  {
    id: 'bowling',
    title: 'GIMMICK BOWLING',
    tagline: '壁で曲げて、全部倒す。',
    description: '3Dボウリング。普通のレーンに加えて、反発壁とバンパーを使って狙うバンクボウリングモード。',
    thumb: 'thumbs/bowling.jpg',
    path: 'bowling/',
    tags: ['3D', 'スポーツ', '物理'],
    accent: '#ff8a7a',
  },
];
