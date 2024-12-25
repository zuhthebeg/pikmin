// app.js
const { createApp, ref, computed, onMounted, watch } = Vue
// translations는 전역 변수로 사용 (translations.js에서 정의됨)

const app = createApp({
  setup() {
    // 브라우저 언어 감지 함수
    const detectUserLanguage = () => {
      // 저장된 언어가 있으면 그것을 우선 사용
      const savedLang = localStorage.getItem('preferredLanguage');
      if (savedLang) return savedLang;

      // 브라우저 언어 설정 확인
      const browserLang = navigator.language || navigator.userLanguage;
      const lang = browserLang.toLowerCase();

      // 지원하는 언어와 매칭
      if (lang.startsWith('ko')) return 'ko';
      if (lang.startsWith('ja')) return 'ja';
      if (lang.startsWith('zh-tw')) return 'zh-TW';
      if (lang.startsWith('zh')) return 'zh-CN';
      return 'en'; // 기본값은 영어
    };

    const currentLang = ref(detectUserLanguage())
    const savedData = ref({})
    const searchTerm = ref('')
    const colors = ['red', 'yellow', 'blue', 'purple', 'white', 'pink', 'gray']
    
    const pikminTypes = computed(() => 
      Object.keys(translations[currentLang.value].locations)
    )

    // Set 객체를 ref로 감싸서 선언
    const activeFilters = ref(new Set())
    
    // 이미지가 있는 타입만 필터링
    const imageTypes = computed(() => {
      return pikminTypes.value.filter(type => getPikminImage(type))
    })
    
    // 이미지 URL을 기준으로 타입들을 그룹화
    const imageGroups = computed(() => {
      const groups = new Map()
      
      imageTypes.value.forEach(type => {
        const imageUrl = getPikminImage(type)
        if (!imageUrl) return
        if (!groups.has(imageUrl)) {
          groups.set(imageUrl, [])
        }
        groups.get(imageUrl).push(type)
      })
      
      return groups
    })
    
    // 필터 토글 메서드 수정
    const toggleFilter = (imageUrl) => {
      const typesInGroup = imageGroups.value.get(imageUrl) || []
      const allTypesInGroupActive = typesInGroup.every(type => activeFilters.value.has(type))
      
      typesInGroup.forEach(type => {
        if (allTypesInGroupActive) {
          activeFilters.value.delete(type)
        } else {
          activeFilters.value.add(type)
        }
      })
    }
    
    // 필터된 타입 계산 수정
    const filteredTypes = computed(() => {
      const searchLower = searchTerm.value.toLowerCase()
      return pikminTypes.value.filter(type => {
        const matchesSearch = translations[currentLang.value].locations[type]
          .toLowerCase()
          .includes(searchLower)
        
        if (activeFilters.value.size === 0) {
          return matchesSearch
        }
        
        return matchesSearch && !activeFilters.value.has(type)
      })
    })

    const totals = computed(() => {
      return colors.reduce((acc, color) => {
        acc[color] = Object.keys(savedData.value)
          .filter(key => key.startsWith(color) && savedData.value[key])
          .length
        return acc
      }, {})
    })

    const totalTypes = computed(() => filteredTypes.value.length)

    const t = (key, category = 'common') => {
      const categories = ['common', 'categories', 'colors', 'locations'];
      for (let cat of categories) {
        if (translations[currentLang.value][cat]?.[key]) {
          return translations[currentLang.value][cat][key].split(' - ').join('\n');
        }
      }
      return key;
    }

    const changeLanguage = (lang) => {
      currentLang.value = lang
      document.documentElement.lang = lang
      localStorage.setItem('preferredLanguage', lang)
      
      // GTM 이벤트 트래킹
      window.dataLayer?.push({
        'event': 'change_language',
        'language': lang
      });
    }

    const updateCheckbox = (type, color) => {
      const key = `${color}-${type}`
      savedData.value[key] = !savedData.value[key]
      saveToLocalStorage()
      
      // GTM 이벤트 트래킹
      window.dataLayer?.push({
        'event': 'update_checkbox',
        'checkbox_id': `${color}-${type}`,
        'checkbox_state': savedData.value[key]
      });
    }

    const getCheckedCount = (type) => {
      const availableColors = getAvailableColors(type);
      return availableColors.filter(color => 
        savedData.value[`${color}-${type}`]
      ).length;
    }

    const isRowCompleted = (type) => {
      const availableColors = getAvailableColors(type);
      return getCheckedCount(type) === availableColors.length;
    }

    const resetAll = () => {
      if (confirm(t('resetConfirm'))) {
        savedData.value = {}
        saveToLocalStorage()
        
        // GTM 이벤트 트래킹
        window.dataLayer?.push({
          'event': 'reset_all'
        });
      }
    }

    const saveToLocalStorage = () => {
      localStorage.setItem('pikminBloomData', JSON.stringify(savedData.value))
    }

    const loadFromLocalStorage = () => {
      const saved = localStorage.getItem('pikminBloomData')
      if (saved) {
        savedData.value = JSON.parse(saved)
      }
    }

    const isChecked = (color, type) => {
      return savedData.value[`${color}-${type}`]
    }

    // 체크박스에 data-type 속성 추가
    const getCheckboxAttrs = (color, type) => ({
      'data-type': `${color}-${type}`,
      checked: savedData.value[`${color}-${type}`]
    })

    // 희귀 타입 체크
    const isRareType = (type) => type.toLowerCase().includes('rare')

    const getPikminImage = (type) => {
      const baseUrl = 'https://pikmin-map.pixelpirate.fr/assets/icons/picture-book/'
      
      // 희귀 타입의 경우 기본 타입의 이미지를 사용
      const normalizedType = type.replace('rare', '').toLowerCase()
      
      const imageMap = {
        'restaurant': 'Restaurant.png',
        'cafe': 'Cafe.png',
        'dessert1': 'Desert.png',
        'dessert2': 'Desert.png',
        'cinema': 'Theatre.png',
        'movietheater': 'Theatre.png',
        'pharmacy': 'Pharmacy.png',
        'zoo': 'Zoo.png',
        'forest1': 'Forest.png',
        'forest2': 'Forest.png',
        'waterside': 'Water.png',
        'postoffice': 'Posts.png',
        'artgallery': 'Museum.png',
        'airport': 'AirPort.png',
        'station1': 'Station.png',
        'station2': 'Station.png',
        'beach': 'Beach.png',
        'burgershop': 'Hamburger.png',
        'conveniencestore1': 'ConvenienceStore.png',
        'conveniencestore2': 'ConvenienceStore.png',
        'supermarket1': 'Supermarket.png',
        'supermarket2': 'Supermarket.png',
        'bakery': 'Bakery.png',
        'beautysalon': 'Salon.png',
        'clothingstore': 'ClosthingStore.png',
        'park': 'Park.png',
        'park1': 'Park.png',
        'park2': 'Park.png',
        'library': 'Library.png',
        'sushirestaurant': 'SushiRestaurant.png',
        'hill': 'Mountain.png',
        'gym': 'Stadium.png',
        'themepark': 'AmusementPark.png',
        'themepark1': 'AmusementPark.png',
        'themepark2': 'AmusementPark.png',
        'busstop': 'BusStop.png',
        'italianrestaurant': 'ItalianRestaurant.png',
        'ramenshop': 'RamenRestaurant.png',
        'bridge': 'Bridge.png',
        'hotel': 'Hotel.png',
        'cosmetics': 'Cosme.png',
        'shrine': 'Omikuji.png',
        'electronics1': 'Electronics.png',
        'electronics2': 'Electronics.png',
        'electronics3': 'Electronics.png',
        'electronics4': 'Electronics.png',
        'electronics5': 'Electronics.png',
        'electronics6': 'Electronics.png',
        'fairyLights1': 'Electronics.png',
        'fairyLights2': 'Electronics.png',
        'curryrestaurant': 'Curry.png',
        'hardwarestore': 'HardwareStore.png',
        'university': 'University.png',
        'mexicanrestaurant': 'MexicanRestaurant.png'
      }
      
      // 타입을 소문자로 변환하여 매칭
      const lookupType = normalizedType.toLowerCase()
      return imageMap[lookupType] ? `${baseUrl}${imageMap[lookupType]}` : ''
    }

    // 색상 제한이 있는 타입들과 그들의 사용 불가능한 색상 매핑
    const colorRestrictions = {
      'rainy1': ['red', 'yellow', 'purple', 'white', 'pink', 'gray'],
      'rainy2': ['red', 'yellow', 'purple', 'white', 'pink', 'gray'],
      'rainy3': ['red', 'yellow', 'purple', 'white', 'pink', 'gray'],
      'snowy': ['red', 'yellow', 'purple', 'pink', 'gray'],
      'electronics1': ['red','blue', 'purple', 'white', 'pink', 'gray'],
      'electronics2': ['red', 'blue','purple', 'white', 'pink', 'gray'],
      'electronics3': ['red', 'blue','purple', 'white', 'pink', 'gray'],
      'electronics4': ['red','blue', 'purple', 'white', 'pink', 'gray'],
      'electronics5': ['red','blue', 'purple', 'white', 'pink', 'gray'],
      'electronics6': ['red','blue', 'purple', 'white', 'pink', 'gray'],
      'fairyLights1': ['red', 'blue','purple', 'white', 'pink', 'gray'],
      'fairyLights2': ['red', 'blue','purple', 'white', 'pink', 'gray'],
      'marioHat': ['red', 'yellow', 'purple','white', 'pink', 'gray'],
      'rareRestaurant': ['purple', 'white', 'pink', 'gray'],
      'gym': ['purple', 'white', 'pink', 'gray'],
      'themePark1': ['purple', 'white', 'pink', 'gray'],
      'themePark2': ['purple', 'white', 'pink', 'gray'],
      'university': ['purple', 'white', 'pink', 'gray']
    }

    // 특정 타입 사용 가능한 색상 확인
    const getAvailableColors = (type) => {
      if (!colorRestrictions[type]) return colors; // 제한이 없으면 모든 색상 사용 가능
      return colors.filter(color => !colorRestrictions[type].includes(color));
    }

    const isColorAvailable = (type, color) => {
      if (!colorRestrictions[type]) return true;
      return !colorRestrictions[type].includes(color);
    }

    // 이미지가 활성화되었는지 확인하는 메서드
    const isImageActive = (imageUrl) => {
      const typesInGroup = imageGroups.value.get(imageUrl) || []
      return typesInGroup.some(type => activeFilters.value.has(type))
    }

    // 현재 하이라이트된 타입을 추적하기 위한 ref 추가
    const highlightedType = ref(null)
    
    const scrollToType = (imageUrl) => {
      const typesInGroup = imageGroups.value.get(imageUrl) || []
      if (typesInGroup.length === 0) return
      
      const firstType = typesInGroup[0]
      const element = document.querySelector(`[data-type="${firstType}"]`)
      
      if (element) {
        // 이전 하이라이트 제거
        highlightedType.value = null
        
        // 스크롤 시작
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        })

        // 스크롤이 완료된 후 하이라이트 효과 적용
        setTimeout(() => {
          highlightedType.value = firstType
          // 하이라이트 효과를 3초 후에 제거
          setTimeout(() => {
            highlightedType.value = null
          }, 3000)
        }, 500) // 스크롤 완료 예상 시간
      }
    }

    // 맨 위로 스크롤하는 메서드 추가
    const scrollToTop = () => {
      window?.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    watch(currentLang, (newLang) => {
      document.documentElement.lang = newLang
    })

    onMounted(() => {
      loadFromLocalStorage()
      // 페이지 로드 시 저장된 언어 설정 적용
      document.documentElement.lang = currentLang.value
    })

    // totalChecked computed 속성 추가
    const totalChecked = computed(() => {
        return Object.values(totals.value).reduce((sum, count) => sum + count, 0)
    })

    return {
      currentLang,
      translations,
      savedData,
      searchTerm,
      colors,
      filteredTypes,
      totals,
      totalTypes,
      t,
      changeLanguage,
      updateCheckbox,
      getCheckedCount,
      isRowCompleted,
      resetAll,
      isChecked,
      getCheckboxAttrs,
      isRareType,
      getPikminImage,
      isColorAvailable,
      getAvailableColors,
      imageTypes,
      activeFilters,
      toggleFilter,
      imageGroups,
      isImageActive,
      scrollToType,
      highlightedType,
      scrollToTop,
      totalChecked,
    }
  },

  template: `
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <button 
        @click="scrollToTop"
        class="fixed right-4 bottom-4 z-50 p-2 rounded-full bg-white/80 backdrop-blur-sm
               shadow-lg hover:shadow-xl transition-all duration-300
               hover:bg-white hover:scale-110 active:scale-95
               border border-green-100 group"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 text-green-600 group-hover:text-green-700 transition-colors" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>

      <header class="bg-gradient-to-r from-green-600 to-green-700 shadow-lg relative overflow-hidden">
        <div class="container mx-auto px-4 py-3">
          <h1 class="text-2xl sm:text-3xl font-bold text-white text-center drop-shadow-lg">
            {{ t('title') }}
          </h1>
        </div>
      </header>

      <main class="container mx-auto px-2 sm:px-4 py-4">
        <div class="flex flex-wrap gap-2 mb-4 max-w-xl mx-auto">
          <button
            v-for="[imageUrl, types] in imageGroups"
            :key="imageUrl"
            @click="scrollToType(imageUrl)"
            :class="[
              'flex items-center p-2 rounded-lg transition-all',
              'hover:bg-green-50',
              'bg-white hover:shadow-md active:scale-95'
            ]"
            :title="types.map(type => t(type)).join(' / ')"
          >
            <img
              :src="imageUrl"
              :alt="types[0]"
              class="w-6 h-6 object-contain"
            >
          </button>
          
          <select v-model="currentLang" 
                  @change="changeLanguage(currentLang)"
                  class="w-[120px] text-gray-700 border border-gray-300 rounded-lg px-2 py-1 text-sm
                         hover:border-green-500 transition-all cursor-pointer bg-white
                         focus:outline-none focus:ring-1 focus:ring-green-500">
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
          </select>
        </div>

        <div class="relative max-w-xl mx-auto mb-4">
          <input type="text" 
                 v-model="searchTerm" 
                 :placeholder="t('searchPlaceholder')"
                 class="w-full px-4 py-2 border-2 border-green-200 rounded-xl 
                        focus:ring-2 focus:ring-green-500 focus:border-green-500 
                        transition-all duration-300 pl-10">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </span>
        </div>

        <div class="overflow-y-auto overflow-x-auto h-full">
        <table class="w-full">
            <thead>
            <tr>
                <th class="bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-2 sm:px-4 w-[80px] sm:w-[90px]">
                {{ t('type') }}
                </th>
                <th v-for="color in colors" :key="color" 
                    :class="'bg-gradient-to-r from-' + color + '-500 to-' + color + '-600 text-white py-4 px-2 sm:px-4 w-[48px] sm:w-[60px]'">
                {{ t(color) }}
                </th>
            </tr>
            </thead>

            <tbody class="overflow-y-auto" style="max-height: calc(100vh - 300px);">
            <tr v-for="type in filteredTypes" 
                :key="type"
                :data-type="type"
                :class="[
                  'hover:bg-green-50 transition-all duration-500',
                  type === highlightedType ? 'highlight-row' : ''
                ]"
                class="hover:bg-green-50 transition-colors duration-150"
                :class="{ 
                    'bg-green-100': isRowCompleted(type),
                    'hover:bg-green-200': isRowCompleted(type)
                }"
                :data-rare="isRareType(type)">
                <td class="px-2 sm:px-4 py-3 border-b">
                  <div class="location-cell">
                    <div class="location-info">
                      <div class="flex flex-col items-center gap-2">
                        <img v-if="getPikminImage(type)"
                             :src="getPikminImage(type)"
                             :alt="t(type)"
                             class="location-image"
                        >
                        <div class="text-sm sm:text-base break-words font-semibold text-center">
                          {{ t(type) }}
                        </div>
                      </div>
                      <!-- 프로그래바 영역 주석 처리
                      <div class="progress-container">
                        <template v-if="getCheckedCount(type) === getAvailableColors(type).length">
                          <div class="text-green-600 font-bold text-sm whitespace-nowrap">
                            {{ t('completed') }}
                          </div>
                        </template>
                        <template v-else>
                          <div class="w-full h-1.5 bg-gray-200 rounded-full">
                            <div class="h-full bg-green-500 rounded-full transition-all duration-300"
                                 :style="{ width: (getCheckedCount(type) / getAvailableColors(type).length * 100) + '%' }">
                            </div>
                          </div>
                        </template>
                      </div>
                      -->
                    </div>
                  </div>
                </td>
                <td v-for="color in colors" :key="color" 
                    class="px-1 sm:px-2 py-3 border-b text-center w-[48px] sm:w-[60px]">
                  <input v-if="isColorAvailable(type, color)"
                         type="checkbox" 
                         v-bind="getCheckboxAttrs(color, type)"
                         @change="updateCheckbox(type, color)"
                         :class="[
                             'w-5 h-5 sm:w-6 sm:h-6 rounded-lg transition-transform duration-200 hover:scale-110 cursor-pointer',
                             color === 'white' ? 'border-2 border-gray-300' : '',
                             color === 'gray' ? 'bg-gray-600 border-gray-700 ring-1 ring-white/50' : ''
                         ]">
                </td>
            </tr>
            </tbody>

            <tfoot class="sticky bottom-0 z-10 bg-gray-50">
            <tr class="font-bold">
                <td class="px-2 sm:px-4 py-3">
                {{ t('total') }}
                <div class="text-xs sm:text-sm text-gray-500">{{ totalChecked }} {{ t('checked') }}</div>
                </td>
                <td v-for="color in colors" :key="color" 
                    class="px-2 sm:px-4 py-3 text-center text-base sm:text-lg">
                {{ totals[color] }}
                </td>
            </tr>
            </tfoot>
        </table>
        </div>

        <div class="text-left mt-2 pl-2">
          <a href="#" 
             @click.prevent="resetAll"
             class="text-sm text-gray-500 hover:text-red-500 transition-colors">
            {{ t('resetButton') }}
          </a>
        </div>
      </main>
    </div>
  `
})

app.mount('#app')