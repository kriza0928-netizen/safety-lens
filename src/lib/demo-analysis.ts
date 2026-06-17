import type { SafetyAnalysisResult } from "./types";

export function generateDemoAnalysis(): SafetyAnalysisResult {
  return {
    siteSummary:
      "데모 모드 결과입니다. 업로드하신 사진을 AI가 직접 분석한 것이 아니며, 일반적인 산업현장 안전 점검 항목을 참고용으로 제시합니다. 실제 AI 분석은 설정에서 API Key를 등록한 뒤 AI 분석 모드를 선택하세요.",
    hazards: [
      {
        title: "작업자 보호구 착용 상태",
        description:
          "안전모·안전화·보호복 등 착용 여부를 점검 필요합니다. 사진만으로는 착용 상태를 확정하기 어려우므로 추가 확인 필요.",
      },
      {
        title: "추락·낙하 위험 구역",
        description:
          "고소 작업, 개구부, 자재 적치 구역 등에서 추락·낙하 위험이 있을 수 있습니다. 개선 권고: 추락방호망·난간·개구부 덮개 설치 여부를 확인하세요.",
      },
      {
        title: "정리정돈 및 통로 확보",
        description:
          "작업 통로와 비상대피로 주변에 자재·장비가 적치되어 있으면 넘어짐·충돌 위험이 있습니다. 개선 권고: 통로 확보 및 정리정돈 점검.",
      },
    ],
    accidentTypes: [
      "추락·낙하",
      "넘어짐·전도",
      "협착·끼임",
      "부딪힘",
    ],
    riskLevel: "medium",
    immediateActions: [
      "작업 구역 내 보호구 착용 상태를 즉시 점검하세요.",
      "고소·개구부 주변 추락방호 조치 여부를 확인하세요.",
      "작업 통로와 비상구 주변 장애물을 제거하세요.",
    ],
    preventionMeasures: [
      "작업 시작 전 TBM(Tool Box Meeting)에서 위험요소를 공유하세요.",
      "정기 안전 순찰 체크리스트를 현장에 비치하세요.",
      "위험 구역 표시 및 출입 통제를 강화하세요.",
    ],
    additionalChecks: [
      "사진 촬영 각도·거리로는 일부 위험요소가 가려져 있을 수 있습니다. 현장 직접 확인 필요.",
      "전기·화기·밀폐공간 등 사진에 보이지 않는 위험요소는 별도 점검이 필요합니다.",
    ],
    safetyCheckpoints: [
      "보호구 착용 및 상태",
      "추락·낙하 방호시설",
      "작업장 정리정돈",
      "비상대피로 확보",
      "장비·공구 안전 상태",
      "위험 표지판·출입통제",
    ],
    legalReferences: [
      {
        law: "산업안전보건법",
        article: "제38조 제1항",
        description: "사업주는 추락·붕괴 등의 위험이 있는 장소에 안전조치를 하여야 한다.",
      },
      {
        law: "산업안전보건기준에 관한 규칙",
        article: "제13조 제1항",
        description: "사업주는 높이 2미터 이상의 작업발판 끝이나 개구부에 안전난간을 설치하여야 한다.",
      },
      {
        law: "산업안전보건기준에 관한 규칙",
        article: "제32조 제1항",
        description: "사업주는 근로자에게 안전모·안전화 등 보호구를 지급하고 착용하도록 하여야 한다.",
      },
      {
        law: "KOSHA GUIDE",
        article: "G-81-2023",
        description: "추락재해 예방을 위한 안전작업 지침",
      },
    ],
  };
}
