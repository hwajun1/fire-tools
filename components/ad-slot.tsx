/**
 * 애드센스 광고 슬롯 플레이스홀더.
 * 실제 연동 시 주석을 해제하고 data-ad-slot을 채운다.
 */
export function AdSlot({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/*
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXX"
        data-ad-slot="XXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      */}
    </div>
  );
}
