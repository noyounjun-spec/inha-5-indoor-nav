export interface PlanImage {
  /** 도면 이미지 URL (Vite가 빌드 때 파일을 복사하고 주소를 넣는다) */
  source: string;
  width: number;
  height: number;
}
