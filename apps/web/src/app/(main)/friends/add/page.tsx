'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import {
  IoArrowBack,
  IoSearchOutline,
  IoLocationOutline,
  IoQrCodeOutline,
  IoPersonAddOutline,
  IoCameraOutline,
} from 'react-icons/io5';

type Tab = 'search' | 'nearby' | 'qr';

interface PetResult {
  id: string;
  name: string;
  species: string;
  breed?: string;
  profileImage?: string;
  bio?: string;
  distance?: number;
}

export default function AddFriendPage() {
  const router = useRouter();
  const pet = usePetStore((s) => s.pet);
  const [tab, setTab] = useState<Tab>('search');

  if (!pet) {
    return (
      <div className="px-4 py-20 text-center text-gray-500">
        펫을 먼저 등록해주세요
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => router.back()} className="text-gray-600">
          <IoArrowBack size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">친구 추가</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'search' as Tab, label: '검색', Icon: IoSearchOutline },
          { key: 'nearby' as Tab, label: '근처', Icon: IoLocationOutline },
          { key: 'qr' as Tab, label: 'QR', Icon: IoQrCodeOutline },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium ${
              tab === t.key
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-500'
            }`}
          >
            <t.Icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'search' && <SearchTab petId={pet.id} />}
      {tab === 'nearby' && <NearbyTab petId={pet.id} />}
      {tab === 'qr' && <QRTab petId={pet.id} petName={pet.name} />}
    </div>
  );
}

// ============ Search Tab ============
function SearchTab({ petId }: { petId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PetResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiClient<PetResult[]>(
          `/api/search/pets?q=${encodeURIComponent(query.trim())}`,
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleRequest = async (receiverId: string) => {
    try {
      await apiClient('/api/friends/request', {
        method: 'POST',
        body: { receiverId, method: 'SEARCH' },
      });
      setSentIds((prev) => new Set(prev).add(receiverId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '요청 실패');
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="relative">
        <IoSearchOutline
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="펫 이름 또는 품종으로 검색"
          autoFocus
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:bg-white"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-500">
          검색 결과가 없습니다
        </div>
      )}

      <div className="mt-3 divide-y divide-gray-50">
        {results.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            sent={sentIds.has(pet.id)}
            onRequest={() => handleRequest(pet.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============ Nearby Tab ============
function NearbyTab({ petId }: { petId: string }) {
  const [pets, setPets] = useState<PetResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [located, setLocated] = useState(false);

  const findNearby = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('위치 서비스를 지원하지 않는 브라우저입니다');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await apiClient<PetResult[]>(
            `/api/friends/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=10`,
          );
          setPets(data);
          setLocated(true);
        } catch {
          setError('근처 펫을 불러오는 데 실패했습니다');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('위치 권한이 필요합니다. 브라우저 설정에서 위치를 허용해주세요.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleRequest = async (receiverId: string) => {
    try {
      await apiClient('/api/friends/request', {
        method: 'POST',
        body: { receiverId, method: 'NEARBY' },
      });
      setSentIds((prev) => new Set(prev).add(receiverId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '요청 실패');
    }
  };

  return (
    <div className="px-4 py-4">
      {!located && !loading && (
        <div className="py-12 text-center">
          <IoLocationOutline size={48} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm text-gray-600">
            내 위치 주변의 펫을 찾아보세요
          </p>
          <p className="mt-1 text-xs text-gray-400">반경 10km 이내 펫을 검색합니다</p>
          <button
            onClick={findNearby}
            className="mt-4 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white"
          >
            주변 탐색하기
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">위치를 확인하고 있어요...</p>
        </div>
      )}

      {error && (
        <div className="py-12 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={findNearby}
            className="mt-3 text-sm text-orange-500 underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {located && !loading && pets.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-500">
          근처에 펫이 없습니다
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {pets.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            sent={sentIds.has(pet.id)}
            onRequest={() => handleRequest(pet.id)}
            showDistance
          />
        ))}
      </div>
    </div>
  );
}

// ============ QR Tab ============
function QRTab({ petId, petName }: { petId: string; petName: string }) {
  const [mode, setMode] = useState<'show' | 'scan'>('show');
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<PetResult | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const qrValue = JSON.stringify({ petId, petName, type: 'pettopia-friend' });

  const handleScanSubmit = async () => {
    if (!scanInput.trim()) return;

    let targetPetId = scanInput.trim();

    // Try to parse as JSON (QR data)
    try {
      const parsed = JSON.parse(targetPetId);
      if (parsed.petId) targetPetId = parsed.petId;
    } catch {
      // Treat as raw pet ID
    }

    try {
      const pet = await apiClient<PetResult>(`/api/pets/${targetPetId}`);
      setScanResult(pet);
    } catch {
      alert('펫을 찾을 수 없습니다. QR 코드를 다시 확인해주세요.');
    }
  };

  const handleRequest = async () => {
    if (!scanResult) return;
    setSending(true);
    try {
      await apiClient('/api/friends/request', {
        method: 'POST',
        body: { receiverId: scanResult.id, method: 'QR_CODE' },
      });
      setSent(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '요청 실패');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 py-4">
      {/* Mode toggle */}
      <div className="mb-4 flex rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setMode('show')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === 'show' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          내 QR 코드
        </button>
        <button
          onClick={() => setMode('scan')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === 'scan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          QR 입력
        </button>
      </div>

      {mode === 'show' && (
        <div className="flex flex-col items-center py-6">
          <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100">
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="mt-4 text-base font-semibold text-gray-900">{petName}</p>
          <p className="mt-1 text-xs text-gray-500">
            다른 사용자가 이 QR 코드를 스캔하면 친구 요청을 보낼 수 있어요
          </p>
        </div>
      )}

      {mode === 'scan' && (
        <div className="py-4">
          <p className="mb-3 text-sm text-gray-600">
            상대방의 QR 코드 데이터 또는 펫 ID를 입력해주세요
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="QR 데이터 또는 펫 ID 입력"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
            />
            <button
              onClick={handleScanSubmit}
              disabled={!scanInput.trim()}
              className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              확인
            </button>
          </div>

          {scanResult && (
            <div className="mt-4 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full bg-gray-200">
                  {scanResult.profileImage ? (
                    <img
                      src={scanResult.profileImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🐾
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{scanResult.name}</p>
                  <p className="text-xs text-gray-500">
                    {speciesLabel(scanResult.species)}
                    {scanResult.breed && ` · ${scanResult.breed}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRequest}
                disabled={sending || sent}
                className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold ${
                  sent
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-orange-500 text-white'
                }`}
              >
                {sent ? '요청 완료' : sending ? '요청 중...' : '친구 요청 보내기'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Shared Components ============
function PetCard({
  pet,
  sent,
  onRequest,
  showDistance,
}: {
  pet: PetResult;
  sent: boolean;
  onRequest: () => void;
  showDistance?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/pet/${pet.id}`}>
        <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
          {pet.profileImage ? (
            <img src={pet.profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg">🐾</div>
          )}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/pet/${pet.id}`}>
          <p className="text-sm font-semibold text-gray-900">{pet.name}</p>
          <p className="text-xs text-gray-500">
            {speciesLabel(pet.species)}
            {pet.breed && ` · ${pet.breed}`}
            {showDistance && pet.distance != null && (
              <span className="ml-1 text-orange-500">
                {pet.distance < 1
                  ? `${Math.round(pet.distance * 1000)}m`
                  : `${pet.distance.toFixed(1)}km`}
              </span>
            )}
          </p>
        </Link>
      </div>
      <button
        onClick={onRequest}
        disabled={sent}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
          sent
            ? 'bg-gray-100 text-gray-400'
            : 'bg-orange-500 text-white'
        }`}
      >
        {sent ? (
          '요청됨'
        ) : (
          <>
            <IoPersonAddOutline size={14} />
            친구 요청
          </>
        )}
      </button>
    </div>
  );
}

function speciesLabel(species: string) {
  const map: Record<string, string> = {
    DOG: '강아지', CAT: '고양이', BIRD: '새', RABBIT: '토끼',
    HAMSTER: '햄스터', FISH: '물고기', REPTILE: '파충류', OTHER: '기타',
  };
  return map[species] || species;
}
