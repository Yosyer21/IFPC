import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany(),
    prisma.savedPlayer.deleteMany(),
    prisma.scoutingReport.deleteMany(),
    prisma.agentPlayer.deleteMany(),
    prisma.clubStaff.deleteMany(),
    prisma.inquiry.deleteMany(),
    prisma.requirement.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.negotiation.deleteMany(),
    prisma.trial.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversationParticipant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.campRegistration.deleteMany(),
    prisma.camp.deleteMany(),
    prisma.liveSession.deleteMany(),
    prisma.document.deleteMany(),
    prisma.evaluation.deleteMany(),
    prisma.playerGoal.deleteMany(),
    prisma.pathway.deleteMany(),
    prisma.trainingContent.deleteMany(),
    prisma.video.deleteMany(),
    prisma.application.deleteMany(),
    prisma.savedOpportunity.deleteMany(),
    prisma.opportunity.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.academy.deleteMany(),
    prisma.university.deleteMany(),
    prisma.club.deleteMany(),
    prisma.agent.deleteMany(),
    prisma.scout.deleteMany(),
    prisma.coach.deleteMany(),
    prisma.parent.deleteMany(),
    prisma.player.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('Base de datos reseteada.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
