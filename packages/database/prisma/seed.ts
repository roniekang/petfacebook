import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 기본 지역 데이터 시드
  const regions = [
    { code: "11", name: "서울특별시", level: "PROVINCE" as const },
    { code: "11010", name: "종로구", level: "CITY" as const, parentCode: "11" },
    { code: "11020", name: "중구", level: "CITY" as const, parentCode: "11" },
    { code: "11030", name: "용산구", level: "CITY" as const, parentCode: "11" },
    { code: "11040", name: "성동구", level: "CITY" as const, parentCode: "11" },
    { code: "11050", name: "광진구", level: "CITY" as const, parentCode: "11" },
    { code: "11060", name: "동대문구", level: "CITY" as const, parentCode: "11" },
    { code: "11070", name: "중랑구", level: "CITY" as const, parentCode: "11" },
    { code: "11080", name: "성북구", level: "CITY" as const, parentCode: "11" },
    { code: "11090", name: "강북구", level: "CITY" as const, parentCode: "11" },
    { code: "11100", name: "도봉구", level: "CITY" as const, parentCode: "11" },
    { code: "11110", name: "노원구", level: "CITY" as const, parentCode: "11" },
    { code: "11120", name: "은평구", level: "CITY" as const, parentCode: "11" },
    { code: "11130", name: "서대문구", level: "CITY" as const, parentCode: "11" },
    { code: "11140", name: "마포구", level: "CITY" as const, parentCode: "11" },
    { code: "11150", name: "양천구", level: "CITY" as const, parentCode: "11" },
    { code: "11160", name: "강서구", level: "CITY" as const, parentCode: "11" },
    { code: "11170", name: "구로구", level: "CITY" as const, parentCode: "11" },
    { code: "11180", name: "금천구", level: "CITY" as const, parentCode: "11" },
    { code: "11190", name: "영등포구", level: "CITY" as const, parentCode: "11" },
    { code: "11200", name: "동작구", level: "CITY" as const, parentCode: "11" },
    { code: "11210", name: "관악구", level: "CITY" as const, parentCode: "11" },
    { code: "11220", name: "서초구", level: "CITY" as const, parentCode: "11" },
    { code: "11230", name: "강남구", level: "CITY" as const, parentCode: "11" },
    { code: "11240", name: "송파구", level: "CITY" as const, parentCode: "11" },
    { code: "11250", name: "강동구", level: "CITY" as const, parentCode: "11" },
  ];

  for (const region of regions) {
    await prisma.region.upsert({
      where: { code: region.code },
      update: {},
      create: region,
    });
  }

  // 기본 Pet Haven 아이템
  const havenItems = [
    { name: "별빛 배경", category: "BACKGROUND" as const, price: 100, description: "은은한 별빛이 빛나는 배경" },
    { name: "무지개 배경", category: "BACKGROUND" as const, price: 150, description: "무지개 다리가 보이는 배경" },
    { name: "하얀 백합", category: "FLOWER" as const, price: 30, description: "순수한 하얀 백합 꽃다발" },
    { name: "분홍 장미", category: "FLOWER" as const, price: 30, description: "사랑을 담은 분홍 장미" },
    { name: "추모 촛불", category: "CANDLE" as const, price: 20, description: "따뜻한 빛의 추모 촛불" },
    { name: "영원의 촛불", category: "CANDLE" as const, price: 50, description: "꺼지지 않는 영원의 촛불" },
    { name: "하트 액자", category: "FRAME" as const, price: 80, description: "하트 모양의 사진 액자" },
    { name: "골드 액자", category: "FRAME" as const, price: 120, description: "고급스러운 골드 사진 액자" },
    { name: "별 장식", category: "DECORATION" as const, price: 40, description: "반짝이는 별 장식" },
    { name: "천사 날개", category: "DECORATION" as const, price: 200, description: "천사 날개 장식" },
    { name: "평화로운 멜로디", category: "MUSIC" as const, price: 60, description: "평화로운 배경 음악" },
  ];

  for (const item of havenItems) {
    await prisma.havenShopItem.create({ data: item });
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
