/** Canal simples para a legenda de cena exibida na barra inferior. */
export const SCENE_EVENT = "cinema:scene";

export type SceneDetail = { scene: string; title: string };

export function announceScene(detail: SceneDetail) {
  window.dispatchEvent(new CustomEvent<SceneDetail>(SCENE_EVENT, { detail }));
}
