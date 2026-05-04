
REVOKE EXECUTE ON FUNCTION public.get_challenge_solution(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_solution(uuid) TO authenticated;
