// Career details and four toolkit priority tiers were supplied by the user.
export const profile = {
  // Supply actual contact details and a local/public resume path when available.
  contactEmail: "cho_seunghyun@krafton.com",
  slackProfileUrl: "https://krafton.enterprise.slack.com/user/@U022E9ULBT3",
  resumeUrl: null,
  career: [
    {
      period: "2021–2026",
      role: "Cinematic Technical Artist",
      studio: "KRAFTON · Cinematic Production",
      description: "시네마틱 환경·리깅·시뮬레이션 제작과 Unreal Engine 기반 워크플로 툴 개발을 병행하며, 아트 제작과 기술 구현을 연결했습니다.",
      tags: ["Production Art", "Tool Development", "Pipeline"]
    },
    {
      period: "2015–2021",
      studio: "Animation / VFX Studio",
      roles: [
        {
          period: "2018–2021",
          role: "Rigging & Pipeline Artist",
          description: "전문적인 캐릭터 리깅과 제작 자동화를 중심으로, 반복 작업을 줄이고 작업 효율을 높이는 아티스트 워크플로를 구축했습니다.",
          tags: ["Character Rigging", "Automation", "Pipeline"]
        },
        {
          period: "2015–2018",
          role: "Modeling & Rigging Artist",
          description: "모델링·머티리얼·리깅 작업을 수행하며, 에셋 제작부터 캐릭터 셋업까지 이어지는 프로덕션 전반의 제작 흐름을 익혔습니다.",
          tags: ["Modeling", "Materials", "Rigging"]
        }
      ]
    },
    {
      period: "2012–2014",
      role: "3D Product Artist",
      studio: "Product Design Studio",
      description: "제품 디자인과 3D 모델링을 통해 형태·비례·구조를 분석하고, 디자인 의도를 입체적으로 구현하는 기반을 쌓았습니다.",
      tags: ["Product Design", "3D Modeling"]
    }
  ],
  tools: [
    { name: "Python", priority: 4, icon: "../assets/tools/python.png" },
    { name: "C++", priority: 1, icon: "../assets/tools/cpp.png" },
    { name: "Unreal Engine", priority: 4, enlarged: true, icon: "../assets/tools/unreal-engine.png", focus: "Shaders · Sequencer · Editor Tools" },
    { name: "Maya", priority: 4, enlarged: true, icon: "../assets/tools/maya.png", focus: "Rigging · Animation · Export" },
    { name: "Houdini", priority: 3, icon: "../assets/tools/houdini.png", focus: "Procedural · CFX / FX · Batch" },
    { name: "ComfyUI", priority: 2, icon: "../assets/tools/comfyui.png", focus: "Local AI · Asset / Image Pipelines" },
    { name: "Substance Painter", priority: 2, icon: "../assets/tools/substance-painter.png", focus: "PBR Texturing · Materials" },
    { name: "Blender", priority: 1, icon: "../assets/tools/blender.png", focus: "Asset Editing · AI Asset Workflow" },
    { name: "Marvelous Designer", priority: 3, icon: "../assets/tools/marvelous-designer.png", focus: "Garment Creation · CFX" },
    { name: "Photoshop", priority: 3, icon: "../assets/tools/photoshop.png" }
  ]
};
