'use client'
import KillteamInfo from '@/components/killteam/KillteamInfo';
import { badgeClass } from '@/components/shared/Links';
import { showInfoModal } from '@/lib/utils/showInfoModal';
import { KillteamPlain } from "@/types";
import { FiInfo } from 'react-icons/fi';

export default function KillteamInfoButton({ killteam }: { killteam: KillteamPlain }) {

  return (
    <button 
      className={badgeClass}
      onClick={() => showInfoModal({
        title: killteam.killteamName,
        body: (<div className="overflow-y-auto flex-1"><KillteamInfo killteam={killteam} /></div>)
      })}
      aria-label="Tools"
    >
      <FiInfo/> Composition/Equipment/Ploys
    </button>
  )
}