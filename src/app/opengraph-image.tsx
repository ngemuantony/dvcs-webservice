import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'DVCS Web Service';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(90deg, #000 0%, #333 100%)',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        DVCS
      </div>
    ),
    {
      ...size,
    }
  );
}
