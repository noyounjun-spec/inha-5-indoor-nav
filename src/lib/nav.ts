// 화면 이동 도우미
import { useNavigate } from 'react-router';

/** 뒤로 가기. 이 앱 안에서 온 기록이 없으면(주소로 바로 들어온 경우) 홈으로 간다. */
export function useBack() {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  };
}
