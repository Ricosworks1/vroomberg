import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const owner = process.env.GITHUB_REPO_OWNER || 'Ricosworks1';
    const repo = process.env.GITHUB_REPO_NAME || 'blockchain-payment-flow-analysis';

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          // Add GitHub token if you have one to avoid rate limits
          // 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch releases');
    }

    const releases = await response.json();

    // Return only the latest 6 releases
    return NextResponse.json(releases.slice(0, 6));
  } catch (error) {
    console.error('Error fetching releases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch releases' },
      { status: 500 }
    );
  }
}
