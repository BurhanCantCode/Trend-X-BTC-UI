import { DetailedHTMLProps, HTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'
import { NextPage } from 'next'
import { AppProps } from 'next/app'
import { HTMLMotionProps } from 'framer-motion'

declare global {
  type NextPageWithLayout = NextPage & {
    getLayout?: (page: ReactElement) => ReactNode
  }

  type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout
  }

  namespace JSX {
    interface IntrinsicElements {
      div: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
      span: DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
      h1: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      h2: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      h3: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      p: DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
      button: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
      nav: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      header: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      main: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      'motion.div': HTMLMotionProps<'div'>
      'motion.p': HTMLMotionProps<'p'>
      'motion.span': HTMLMotionProps<'span'>
      'motion.h1': HTMLMotionProps<'h1'>
      Link: any
      Card: any
      Button: any
      Input: any
      ScrollArea: any
      Avatar: any
      AvatarImage: any
      AvatarFallback: any
    }
  }
}

export {} 