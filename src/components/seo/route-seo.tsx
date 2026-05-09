import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteSeo } from '@/config/seo'

export function RouteSeo() {
  const location = useLocation()

  useEffect(() => {
    const seo = getRouteSeo(location.pathname)
    document.title = seo.title

    let descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta')
      descriptionTag.setAttribute('name', 'description')
      document.head.appendChild(descriptionTag)
    }

    descriptionTag.setAttribute('content', seo.description)
  }, [location.pathname])

  return null
}
