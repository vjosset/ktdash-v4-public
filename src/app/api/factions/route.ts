import { FactionService } from '@/services';
import { Faction } from '@/types';
import { NextResponse } from 'next/server';

// Get all factions and killteams
export async function GET(req: Request) {
  const url = new URL(req.url);
  const loadDetails = url.searchParams.get('loadDetails') === 'true';

  let factions: Faction[] = [];
  if (loadDetails) {
    factions = await FactionService.getAllFactionsWithDetails();
  } else {
    factions = await FactionService.getAllFactions();
  }

  return NextResponse.json(factions)
}
