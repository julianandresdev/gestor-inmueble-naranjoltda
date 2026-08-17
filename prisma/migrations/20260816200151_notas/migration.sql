-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "inmuebleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notas_inmuebleId_idx" ON "notas"("inmuebleId");

-- CreateIndex
CREATE INDEX "notas_authorId_idx" ON "notas"("authorId");

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "inmuebles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
